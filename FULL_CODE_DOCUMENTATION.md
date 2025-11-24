# NeuroSync – Full Code Documentation

---

## Table of Contents
1. [Backend (FastAPI)](#backend-fastapi)
   - [env_loader.py](#env_loaderpy)
   - [app.py](#apppy)
   - [rag_agent.py](#rag_agentpy)
   - [spotify_service.py](#spotify_servicepy)
2. [Frontend (Vite + React)](#frontend-vite--react)
   - [src/config/api.ts](#srcconfigapits)
   - [src/main.tsx](#srcmaintsx)
   - [src/App.tsx (excerpt)](#srcappttsx)
3. [Package Configuration](#packagejson)
4. [.env example](#env-example)

---

## Backend – FastAPI
### `env_loader.py`
```python
"""
Robust environment variable loader for NeuroSync backend.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv


class EnvLoader:
    """Handles robust loading and validation of environment variables."""

    # Define all required environment variables with descriptions
    REQUIRED_VARS = {
        "ASSEMBLYAI_API_KEY": "AssemblyAI API key for audio transcription",
        "SUPABASE_URL": "Supabase project URL",
        "SUPABASE_KEY": "Supabase service role key (not anon key!)",
        "SPOTIFY_CLIENT_ID": "Spotify API client ID",
        "SPOTIFY_CLIENT_SECRET": "Spotify API client secret",
        "GEMINI_API_KEY": "Google Gemini API key for wellness plan generation",
    }

    # Optional environment variables
    OPTIONAL_VARS = {
        "N8N_WEBHOOK_URL": "n8n webhook URL for wellness plan delivery",
        "N8N_CRISIS_WEBHOOK_URL": "n8n webhook URL for crisis alerts",
        "GROQ_API_KEY": "Groq API key (legacy, not currently used)",
    }

    def __init__(self):
        self.env_path: Optional[Path] = None
        self.loaded_vars: Dict[str, str] = {}
        self.missing_vars: List[str] = []

    def find_env_file(self) -> Path:
        """Find the .env file in the backend directory.

        Strategies:
        1. Same directory as this file.
        2. Project root /backend/.env.
        3. Current working directory.
        4. Parent of cwd /backend/.env.
        """
        backend_dir = Path(__file__).parent
        env_path = backend_dir / '.env'
        if env_path.exists():
            return env_path
        cwd = Path.cwd()
        for candidate in [cwd / 'backend' / '.env', cwd / '.env', cwd.parent / 'backend' / '.env']:
            if candidate.exists():
                return candidate
        raise FileNotFoundError(
            f"Could not find .env file. Searched in:\n"
            f"  1. {backend_dir / '.env'}\n"
            f"  2. {cwd / 'backend' / '.env'}\n"
            f"  3. {cwd / '.env'}\n"
            f"  4. {cwd.parent / 'backend' / '.env'}\n"
            "\nPlease ensure backend/.env exists in your project."
        )

    def load(self) -> bool:
        """Load environment variables from .env file.
        Returns True on success, False otherwise.
        """
        try:
            self.env_path = self.find_env_file()
            print(f"[INFO] Loading environment from: {self.env_path}")
            load_dotenv(dotenv_path=self.env_path, override=True)
            print("[OK] Environment file loaded successfully")
            return True
        except FileNotFoundError as e:
            print(f"[ERROR] {e}")
            return False
        except Exception as e:
            print(f"[ERROR] Failed to load .env file: {e}")
            return False

    def validate(self) -> bool:
        """Validate that all required environment variables are present.
        Returns True if everything is OK, False otherwise.
        """
        print("\n[INFO] Validating environment variables...")
        all_valid = True
        self.missing_vars = []
        for var_name, description in self.REQUIRED_VARS.items():
            value = os.getenv(var_name)
            if not value:
                print(f"[ERROR] Missing required variable: {var_name}")
                print(f"        Description: {description}")
                self.missing_vars.append(var_name)
                all_valid = False
            elif value.startswith("your_") or value == "":
                print(f"[ERROR] Variable {var_name} has placeholder value: {value}")
                print(f"        Description: {description}")
                self.missing_vars.append(var_name)
                all_valid = False
            else:
                masked = self._mask_value(value)
                print(f"[OK] {var_name}: {masked}")
                self.loaded_vars[var_name] = value
        print("\n[INFO] Optional variables:")
        for var_name, description in self.OPTIONAL_VARS.items():
            value = os.getenv(var_name)
            if value:
                print(f"[OK] {var_name}: {self._mask_value(value)}")
                self.loaded_vars[var_name] = value
            else:
                print(f"[WARN] {var_name}: Not set ({description})")
        if not all_valid:
            print("\n" + "="*60)
            print("[ERROR] Environment validation FAILED!")
            print("="*60)
            print("\nMissing or invalid variables:")
            for var in self.missing_vars:
                print(f"  - {var}: {self.REQUIRED_VARS[var]}")
            print("\nPlease update your backend/.env file with valid values.")
            print("See backend/.env.example for the correct format.")
            print("="*60 + "\n")
            return False
        print("\n[OK] All required environment variables validated successfully!\n")
        return True

    def _mask_value(self, value: str) -> str:
        """Mask sensitive values for display, showing only the last 4 chars."""
        if len(value) <= 4:
            return "***"
        return f"{'*' * min(20, len(value) - 4)}{value[-4:]}"

    def get_summary(self) -> Dict[str, any]:
        """Return a summary dict of the loading status."""
        return {
            "env_file_path": str(self.env_path) if self.env_path else None,
            "loaded_count": len(self.loaded_vars),
            "missing_count": len(self.missing_vars),
            "missing_vars": self.missing_vars,
        }

# Global singleton – ensures we only load once
_env_loader = None
_initialized = False

def load_and_validate_env() -> bool:
    """Load and validate environment variables. Raises ValueError on failure."""
    global _env_loader
    if _env_loader is None:
        _env_loader = EnvLoader()
    if not _env_loader.load():
        raise ValueError("Failed to load .env file. See error messages above.")
    if not _env_loader.validate():
        raise ValueError(
            f"Missing required environment variables: {', '.join(_env_loader.missing_vars)}\n"
            "Please check backend/.env and ensure all required variables are set."
        )
    return True

def get_env_summary() -> Dict[str, any]:
    """Get a summary of the environment loading status."""
    global _env_loader
    if _env_loader is None:
        return {"error": "Environment not loaded yet"}
    return _env_loader.get_summary()

def ensure_env_loaded() -> bool:
    """Idempotent helper – loads env only once and prints a nice banner."""
    global _initialized
    if _initialized:
        return True
    try:
        print("\n" + "="*60)
        print("NeuroSync Backend - Environment Loader")
        print("="*60 + "\n")
        load_and_validate_env()
        print("="*60)
        print("Environment loaded successfully!")
        print("="*60 + "\n")
        _initialized = True
        return True
    except Exception as e:
        print("\n" + "="*60)
        print("CRITICAL ERROR: Environment loading failed!")
        print("="*60)
        print(f"\nError: {e}\n")
        print("The application cannot start without valid environment variables.")
        print("Please fix the issues above and try again.\n")
        print("="*60 + "\n")
        raise
```

---

### `app.py`
```python
import os
import sys
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from supabase import create_client, Client
import assemblyai as aai

# Load environment first
from env_loader import ensure_env_loaded

try:
    ensure_env_loaded()
except Exception as e:
    print(f"\n❌ FATAL ERROR: {e}\n")
    sys.exit(1)

# ---------- FastAPI setup ----------
app = FastAPI()

# CORS – allow Vite dev and Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://*.vercel.app",
        "https://neurosync.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Supabase client ----------
try:
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    print("[OK] Backend ready! Listening on http://0.0.0.0:8000\n")
except Exception as e:
    print(f"\n[ERROR] Supabase error: {e}\n")
    sys.exit(1)

# ---------- Request models ----------
class TranscribeRequest(BaseModel):
    user_id: str
    audio_id: str
    user_phone: str

# ---------- Health endpoint ----------
@app.get("/")
def read_root():
    return {"status": "NeuroSync API is running", "version": "2.0"}

# ---------- Transcription endpoint ----------
@app.post("/api/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    try:
        print("\n" + "="*60)
        print("[NEW REQUEST] Transcription request")
        print(f"   User: {request.user_id}")
        print(f"   Audio: {request.audio_id}")
        print("="*60 + "\n")

        # Emergency contacts
        emergency_contacts = (
            supabase.table("emergency_contacts")
            .select("whatsapp_number, name, relationship")
            .eq("user_id", request.user_id)
            .execute()
            .data
            or []
        )

        # Audio URL
        audio_url = supabase.storage.from_("audio_recording").get_public_url(request.audio_id)

        # Verify file exists
        file_response = requests.head(audio_url, timeout=5)
        if file_response.status_code != 200:
            raise HTTPException(404, "Audio file not found")

        # Record in DB
        record = (
            supabase.table("audio_recordings")
            .insert({
                "user_id": request.user_id,
                "file_url": audio_url,
                "file_path": request.audio_id,
                "status": "processing",
                "created_at": datetime.now().isoformat(),
            })
            .execute()
        )
        record_id = record.data[0]["id"]

        # Transcribe
        print("[INFO] Transcribing...")
        config = aai.TranscriptionConfig(
            sentiment_analysis=True,
            language_code="en",
        )
        transcript = aai.Transcriber().transcribe(audio_url, config=config)
        if transcript.error:
            raise Exception(f"Transcription failed: {transcript.error}")
        transcript_text = transcript.text or "[No speech detected]"
        print(f"[OK] Transcribed: {len(transcript_text)} chars\n")

        # Sentiment & anxiety detection (helpers in utils.py – omitted for brevity)
        sentiments = transcript.sentiment_analysis
        mood_numeric = sentiments[0].sentiment_score if sentiments else 0.5
        anxiety_score = detect_anxiety(transcript_text)  # defined elsewhere
        crisis_flag = detect_crisis(transcript_text)    # defined elsewhere

        print("[INFO] Analysis:")
        print(f"   Mood: {mood_numeric:.2f}")
        print(f"   Anxiety: {anxiety_score:.2f}")
        print(f"   Crisis: {crisis_flag}")

        # Wellness plan via RAG agent (lazy‑loaded)
        print("\n[INFO] Generating wellness plan...")
        wellness_plan = rag_agent.generate_plan(
            transcript_text,
            mood_numeric,
            anxiety_score,
            crisis_flag,
        )

        # Store plan
        supabase.table("wellness_plans").insert({
            "audio_recording_id": record_id,
            "plan": wellness_plan,
            "created_at": datetime.now().isoformat(),
        }).execute()

        # Update audio record status
        supabase.table("audio_recordings").update({"status": "completed"}).eq("id", record_id).execute()

        # Optional: send plan via n8n webhook
        if os.getenv("N8N_WEBHOOK_URL"):
            try:
                requests.post(
                    os.getenv("N8N_WEBHOOK_URL"),
                    json={
                        "user_id": request.user_id,
                        "plan": wellness_plan,
                        "phone": request.user_phone,
                        "emergency_contacts": emergency_contacts,
                    },
                    timeout=5,
                )
            except Exception:
                pass

        print("[OK] Complete!\n")
        return {
            "success": True,
            "plan": wellness_plan,
            "audio_recording_id": record_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n[ERROR] {e}\n")
        raise HTTPException(500, str(e))

# ---------- Lazy imports for services ----------
from rag_agent import rag_agent  # lazy proxy
from spotify_service import spotify_service  # lazy proxy

if __name__ == "__main__":
    import uvicorn
    print("\n[STARTING] NeuroSync Backend...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### `rag_agent.py`
```python
import json
import os
from typing import Dict, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai

# ---------- Lazy proxy ----------
class RAGAgentProxy:
    """Proxy that lazily initializes the RAG agent on first access."""

    def __getattr__(self, name):
        return getattr(get_rag_agent(), name)

rag_agent = RAGAgentProxy()

# ---------- Actual agent implementation ----------
class MentalHealthRAGAgent:
    def __init__(self, knowledge_base_path: str):
        # Load knowledge base
        try:
            with open(knowledge_base_path, "r") as f:
                self.knowledge_base = json.load(f)
            print(f"[OK] Knowledge base loaded: {len(self.knowledge_base)} categories")
        except FileNotFoundError:
            print(f"[ERROR] knowledge_base.json not found at {knowledge_base_path}")
            raise
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON in knowledge_base.json: {e}")
            raise

        # Flatten for retrieval (skip crisis_resources)
        self.activities = []
        for category, items in self.knowledge_base.items():
            if category != "crisis_resources":
                for item in items:
                    item["category"] = category
                    self.activities.append(item)
        print(f"[OK] Indexed {len(self.activities)} activities for RAG")

        # TF‑IDF vectorizer
        self.vectorizer = TfidfVectorizer()
        self.activity_texts = [
            f"{act.get('name', '')} {act.get('description', '')} {' '.join(act.get('best_for', []))}"
            for act in self.activities
        ]
        self.activity_vectors = self.vectorizer.fit_transform(self.activity_texts)

        # Gemini model (optional)
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            print("[WARN] GEMINI_API_KEY not set! RAG agent will use fallback mode.")
            self.model = None
        else:
            try:
                genai.configure(api_key=gemini_key)
                self.model = genai.GenerativeModel("gemini-pro")
                print(f"[OK] Gemini API initialized (key: ***{gemini_key[-4:]})")
            except Exception as e:
                print(f"[ERROR] initializing Gemini: {e}")
                self.model = None

    # ---------- Retrieval ----------
    def retrieve_relevant_activities(
        self, transcript: str, mood_score: float, anxiety_score: float, top_k: int = 8
    ) -> List[Dict]:
        mood_description = self._describe_mood(mood_score, anxiety_score)
        query = f"{transcript} {mood_description}"
        query_vector = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vector, self.activity_vectors).flatten()
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        return [self.activities[i] for i in top_indices]

    def _describe_mood(self, mood_score: float, anxiety_score: float) -> str:
        descriptions = []
        if mood_score < 0.3:
            descriptions.append("depression low_energy sadness")
        elif mood_score < 0.5:
            descriptions.append("stress overwhelm difficulty")
        elif mood_score < 0.7:
            descriptions.append("moderate_mood neutral")
        else:
            descriptions.append("positive_mood uplifted")
        if anxiety_score > 0.7:
            descriptions.append("high_anxiety panic worry")
        elif anxiety_score > 0.4:
            descriptions.append("stress tension nervousness")
        else:
            descriptions.append("calm relaxed")
        return " ".join(descriptions)

    # ---------- Plan generation ----------
    def generate_plan(
        self, transcript: str, mood_score: float, anxiety_score: float, crisis_flag: bool
    ) -> Dict:
        print("\n[INFO] Generating wellness plan...")
        print(f"   Mood: {mood_score:.2f}, Anxiety: {anxiety_score:.2f}, Crisis: {crisis_flag}")
        relevant_activities = self.retrieve_relevant_activities(
            transcript, mood_score, anxiety_score, top_k=8
        )
        print(f"   Retrieved {len(relevant_activities)} relevant activities")
        if self.model:
            try:
                return self._generate_with_llm(
                    transcript, mood_score, anxiety_score, crisis_flag, relevant_activities
                )
            except Exception as e:
                print(f"[WARN] LLM generation failed: {e}")
                print("   Falling back to template-based plan")
                return self._get_fallback_plan(
                    mood_score, anxiety_score, crisis_flag, relevant_activities
                )
        else:
            print("   Using template-based plan (no Gemini API)")
            return self._get_fallback_plan(
                mood_score, anxiety_score, crisis_flag, relevant_activities
            )

    def _generate_with_llm(
        self,
        transcript: str,
        mood_score: float,
        anxiety_score: float,
        crisis_flag: bool,
        relevant_activities: List[Dict],
    ) -> Dict:
        prompt = f"""
You are a compassionate mental health assistant. Create a personalized wellness plan.

USER CONTEXT:
- Transcript: "{transcript}"
- Mood Score: {mood_score:.2f} (0=very negative, 1=very positive)
- Anxiety Score: {anxiety_score:.2f} (0=calm, 1=very anxious)
- Crisis Detected: {crisis_flag}

AVAILABLE ACTIVITIES:
{json.dumps(relevant_activities, indent=2)}

TASK: Create a warm, personalized wellness plan. Select 3‑4 activities from the list above.

RETURN EXACTLY THIS JSON STRUCTURE (no markdown, no extra text):
{{
  "immediate_actions": ["Action 1 in 1‑2 sentences", "Action 2", "Action 3"],
  "activities": ["Activity 1 description", "Activity 2", "Activity 3", "Activity 4"],
  "music_recommendation": {{
    "needed": true,
    "description": "Why music helps and what mood to target"
  }}
}}

Keep it warm, actionable, and encouraging. Use simple language.
"""
        response = self.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1000,
            ),
        )
        response_text = response.text.strip()
        # Strip possible markdown fences
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        plan = json.loads(response_text)
        # Basic validation
        if not isinstance(plan.get("immediate_actions"), list):
            raise ValueError("Invalid plan structure: missing immediate_actions")
        if not isinstance(plan.get("activities"), list):
            raise ValueError("Invalid plan structure: missing activities")
        print("   [OK] LLM plan generated successfully")
        return plan

    def _get_fallback_plan(
        self, mood_score: float, anxiety_score: float, crisis_flag: bool, activities: List[Dict]
    ) -> Dict:
        # Immediate actions based on mood / crisis
        if crisis_flag or mood_score < 0.2:
            immediate_actions = [
                "Take slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 4.",
                "If you're feeling overwhelmed, reach out to someone you trust right now.",
                "Remember: This feeling will pass. You've gotten through difficult moments before.",
            ]
        elif mood_score < 0.4:
            immediate_actions = [
                "Start with a simple breathing exercise to calm your nervous system.",
                "Do one small, manageable thing right now - even just washing your face.",
                "Be gentle with yourself. It's okay to not be okay sometimes.",
            ]
        elif mood_score < 0.6:
            immediate_actions = [
                "Take a moment to notice your breathing and relax your shoulders.",
                "Consider doing a quick 5‑minute activity to shift your energy.",
                "Stay hydrated and make sure you've eaten something today.",
            ]
        else:
            immediate_actions = [
                "You're doing well! Keep this positive momentum going.",
                "Consider an activity that brings you joy or helps you relax.",
                "Take a moment to appreciate how you're feeling right now.",
            ]
        # Convert activities to short descriptions (max 4)
        activity_descriptions = []
        for act in activities[:4]:
            name = act.get("name", "Activity")
            desc = act.get("description", "")
            duration = act.get("duration_minutes", 5)
            if desc:
                activity_descriptions.append(f"{name}: {desc} ({duration} minutes)")
            else:
                steps = act.get("steps", [])
                if steps:
                    activity_descriptions.append(f"{name}: {', '.join(steps[:2])} ({duration} minutes)")
                else:
                    activity_descriptions.append(f"{name} ({duration} minutes)")
        # Music recommendation based on anxiety
        if anxiety_score > 0.6:
            music_desc = "Calming, slow‑tempo music can help reduce anxiety and promote relaxation."
        else:
            music_desc = "Uplifting music can boost mood and motivation."
        return {
            "immediate_actions": immediate_actions,
            "activities": activity_descriptions,
            "music_recommendation": {"needed": True, "description": music_desc},
        }

# ---------- Helper to get singleton ----------
_rag_agent_instance: Optional[MentalHealthRAGAgent] = None

def get_rag_agent() -> MentalHealthRAGAgent:
    global _rag_agent_instance
    if _rag_agent_instance is None:
        _rag_agent_instance = MentalHealthRAGAgent("backend/knowledge_base.json")
    return _rag_agent_instance
```

---

### `spotify_service.py`
```python
import os
from typing import Dict, List, Optional
import requests

class SpotifyService:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.access_token: Optional[str] = None
        if not self.client_id or not self.client_secret:
            raise ValueError("Spotify client credentials are missing")
        self._authenticate()

    def _authenticate(self):
        token_url = "https://accounts.spotify.com/api/token"
        resp = requests.post(
            token_url,
            data={"grant_type": "client_credentials"},
            auth=(self.client_id, self.client_secret),
        )
        resp.raise_for_status()
        self.access_token = resp.json()["access_token"]
        print("[OK] Spotify access token obtained")

    def get_playlist_for_mood(self, mood: str) -> Dict:
        # Very simple example – in reality you would query Spotify's recommendations endpoint
        headers = {"Authorization": f"Bearer {self.access_token}"}
        query = f"mood {mood}"  # placeholder query
        resp = requests.get(
            "https://api.spotify.com/v1/search",
            headers=headers,
            params={"q": query, "type": "playlist", "limit": 1},
        )
        resp.raise_for_status()
        data = resp.json()
        if data["playlists"]["items"]:
            return data["playlists"]["items"][0]
        return {}

# Lazy proxy
class SpotifyServiceProxy:
    """Proxy that lazily initializes the Spotify service on first access."""

    def __getattr__(self, name):
        return getattr(get_spotify_service(), name)

spotify_service = SpotifyServiceProxy()

_spotify_instance: Optional[SpotifyService] = None

def get_spotify_service() -> SpotifyService:
    global _spotify_instance
    if _spotify_instance is None:
        _spotify_instance = SpotifyService()
    return _spotify_instance
```

---

## Frontend – Vite + React
### `src/config/api.ts`
```ts
/**
 * API Configuration for NeuroSync
 *
 * This file centralizes all API‑related configuration, ensuring the correct backend URL
 * is used based on the environment.
 */

/** Get the API base URL from environment variables */
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  // Default to localhost if not set (development)
  if (!envUrl) {
    console.warn('VITE_API_URL not set, using default: http://localhost:8000');
    return 'http://localhost:8000';
  }
  return envUrl;
};

/** Base API URL – automatically switches between dev and production */
export const API_URL = getApiUrl();

/** All API endpoints used in the application */
export const API_ENDPOINTS = {
  /** Audio transcription endpoint */
  transcribe: `${API_URL}/api/transcribe`,

  /** Health check endpoint */
  health: `${API_URL}/`,

  // Add more endpoints as needed
  // recordings: `${API_URL}/api/recordings`,
  // userProfile: `${API_URL}/api/user/profile`,
};

/** Log current API configuration (development only) */
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseUrl: API_URL,
    environment: import.meta.env.MODE,
    endpoints: API_ENDPOINTS,
  });
}
```

---

### `src/main.tsx`
```tsx
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
```

---

### `src/App.tsx` (excerpt – core flow)
```tsx
import { useState } from 'react';
import { API_ENDPOINTS } from './config/api';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  const handleTranscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.transcribe, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo_user',
          audio_id: 'sample.wav',
          user_phone: '+1234567890',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPlan(JSON.stringify(data.plan, null, 2));
      } else {
        alert('Transcription failed');
      }
    } catch (e) {
      console.error(e);
      alert('Error contacting backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">NeuroSync Demo</h1>
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded"
        onClick={handleTranscribe}
        disabled={loading}
      >
        {loading ? 'Processing…' : 'Start Transcription'}
      </button>
      {plan && (
        <pre className="mt-4 bg-gray-100 p-4 rounded overflow-x-auto">
          {plan}
        </pre>
      )}
    </div>
  );
}
```

---

## Package Configuration (`package.json` excerpt)
```json
{
  "name": "neurosync",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\" --names \"FRONTEND,BACKEND\" --prefix-colors \"cyan,magenta\"",
    "dev:frontend": "vite",
    "dev:backend": "cd backend && python app.py",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-checkbox": "^1.3.3",
    "@supabase/supabase-js": "^2.39.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^12.23.24",
    "tailwindcss": "^3.4.1"
    // ... many more UI libs omitted for brevity
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "concurrently": "^8.2.2",
    "eslint": "^8.56.0",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}
```

---

## `.env` Example (frontend)
```
# Supabase Configuration (client‑side)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your‑anon‑key‑here

# Backend API URL – change when deploying
VITE_API_URL=http://localhost:8000   # dev
# VITE_API_URL=https://api.yourdomain.com   # production
```

---

### 🎉 All core source files are now documented in one place.
You can open **FULL_CODE_DOCUMENTATION.md** in your editor to browse the entire codebase with syntax‑highlighted snippets.

If you need any additional files (e.g., `vite.config.ts`, `tailwind.config.cjs`, or utility helpers) just let me know and I’ll append them.
