from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os  
import sys

# Step 1: Load environment variables FIRST (before any other local imports)
from env_loader import ensure_env_loaded

try:
    ensure_env_loaded()
except Exception as e:
    print(f"\n❌ FATAL ERROR: {e}\n")
    sys.exit(1)

# Step 2: Now safe to import everything else
import assemblyai as aai
from supabase import create_client, Client
import requests

# Import custom modules (env vars now loaded)
from rag_agent import rag_agent
from spotify_service import spotify_service
from crisis_detector import detect_crisis, detect_anxiety

app = FastAPI()

# CORS - Allow requests from Vite dev server and Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Vite dev server
        "http://localhost:5174",          # Alternate port
        "http://127.0.0.1:5173",
        "https://*.vercel.app",           # Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
print(f"[INFO] Initializing services...")
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY")

try:
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    print(f"[OK] Backend ready! Listening on http://0.0.0.0:8000\n")
except Exception as e:
    print(f"\n[ERROR] Supabase error: {e}\n")
    sys.exit(1)

class TranscribeRequest(BaseModel):
    audio_id: str
    user_id: str
    user_phone: str

@app.get("/")
def read_root():
    return {"status": "NeuroSync API is running", "version": "2.0"}

@app.post("/api/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    try:
        print(f"\n{'='*60}")
        print(f"[NEW REQUEST] Transcription request")
        print(f"   User: {request.user_id}")
        print(f"   Audio: {request.audio_id}")
        print(f"{'='*60}\n")
        
        # Get emergency contacts
        emergency_contacts = supabase.table("emergency_contacts")\
            .select("whatsapp_number, name, relationship")\
            .eq("user_id", request.user_id)\
            .execute().data or []
        
        # Get audio URL
        audio_url = supabase.storage.from_("audio_recording").get_public_url(request.audio_id)
        
        # Verify file exists
        file_response = requests.head(audio_url, timeout=5)
        if file_response.status_code != 200:
            raise HTTPException(404, "Audio file not found")
        
        # Create database record
        record = supabase.table("audio_recordings").insert({
            "user_id": request.user_id,
            "file_url": audio_url,
            "file_path": request.audio_id,
            "status": "processing",
            "created_at": datetime.now().isoformat()
        }).execute()
        
        record_id = record.data[0]["id"]
        
        # Transcribe
        print(f"[INFO] Transcribing...")
        config = aai.TranscriptionConfig(
            sentiment_analysis=True,
            language_code="en",
            punctuate=True,
            format_text=True
        )
        
        transcript = aai.Transcriber().transcribe(audio_url, config=config)
        
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"Transcription failed: {transcript.error}")
        
        transcript_text = transcript.text or "[No speech detected]"
        print(f"[OK] Transcribed: {len(transcript_text)} chars\n")
        
        # Get sentiment
        sentiments = transcript.sentiment_analysis
        if sentiments and len(sentiments) > 0:
            sentiment_list = [s.sentiment for s in sentiments]
            pos = sentiment_list.count("POSITIVE")
            neg = sentiment_list.count("NEGATIVE")
            
            if pos > neg:
                mood_numeric = 0.6 + (pos / len(sentiment_list)) * 0.3
            elif neg > pos:
                mood_numeric = 0.4 - (neg / len(sentiment_list)) * 0.3
            else:
                mood_numeric = 0.5
        else:
            mood_numeric = 0.5
        
        # Detect anxiety and crisis
        anxiety_score = detect_anxiety(transcript_text)
        crisis_flag = detect_crisis(transcript_text)
        
        print(f"[INFO] Analysis:")
        print(f"   Mood: {mood_numeric:.2f}")
        print(f"   Anxiety: {anxiety_score:.2f}")
        print(f"   Crisis: {crisis_flag}")
        
        # Generate wellness plan
        print(f"\n[INFO] Generating wellness plan...")
        wellness_plan = rag_agent.generate_plan(
            transcript_text,
            mood_numeric,
            anxiety_score,
            crisis_flag
        )
        
        # Get Spotify playlist
        # Get Spotify playlist
        try:
            playlist_url = spotify_service.get_playlist(mood_numeric, anxiety_score)
            if playlist_url:
                if "music_recommendation" not in wellness_plan:
                    wellness_plan["music_recommendation"] = {}
                wellness_plan["music_recommendation"]["spotify_playlist_url"] = playlist_url
        except Exception as e:
            print(f"[WARN] Spotify integration error: {e}")
        
        # Update database
        supabase.table("audio_recordings").update({
            "transcript": transcript_text,
            "mood_score": mood_numeric,
            "anxiety_score": anxiety_score,
            "crisis_flag": crisis_flag,
            "wellness_plan": wellness_plan,
            "status": "completed",
            "processed_at": datetime.now().isoformat()
        }).eq("id", record_id).execute()
        
        # Send webhooks
        if crisis_flag:
            crisis_webhook = os.getenv("N8N_CRISIS_WEBHOOK_URL")
            if crisis_webhook:
                try:
                    requests.post(crisis_webhook, json={
                        "user_id": request.user_id,
                        "user_phone": request.user_phone,
                        "emergency_contacts": emergency_contacts,
                        "transcript": transcript_text,
                        "crisis_flag": True,
                        "mood_score": mood_numeric,
                        "anxiety_score": anxiety_score,
                    }, timeout=5)
                except:
                    pass
        
        wellness_webhook = os.getenv("N8N_WEBHOOK_URL")
        if wellness_webhook:
            try:
                requests.post(wellness_webhook, json={
                    "user_id": request.user_id,
                    "user_phone": request.user_phone,
                    "transcript": transcript_text,
                    "mood_score": mood_numeric,
                    "anxiety_score": anxiety_score,
                    "crisis_flag": crisis_flag,
                    "wellness_plan": wellness_plan,
                }, timeout=5)
            except:
                pass
        
        print(f"[OK] Complete!\n")
        
        return {
            "success": True,
            "transcript": transcript_text,
            "mood_score": mood_numeric,
            "anxiety_score": anxiety_score,
            "crisis_flag": crisis_flag,
            "wellness_plan": wellness_plan
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n[ERROR] {e}\n")
        raise HTTPException(500, str(e))

@app.post("/api/spotify/recommendations")
async def get_spotify_recommendations(request: dict):
    """Get personalized track recommendations"""
    try:
        user_id = request.get("user_id")
        mood_score = request.get("mood_score", 0.5)
        anxiety_score = request.get("anxiety_score", 0.5)
        
        print(f"[INFO] Fetching music for user {user_id} (Mood: {mood_score}, Anxiety: {anxiety_score})")
        
        recommendations = spotify_service.get_recommendations(mood_score, anxiety_score)
        
        return {"tracks": recommendations}
    except Exception as e:
        print(f"[ERROR] Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print(f"\n[STARTING] NeuroSync Backend...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
