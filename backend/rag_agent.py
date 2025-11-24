import json
import os
from typing import Dict, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai

class MentalHealthRAGAgent:
    def __init__(self, knowledge_base_path: str):
        # Initialize RAG agent with knowledge base and error handling
        try:
            # Load knowledge base
            with open(knowledge_base_path, 'r') as f:
                self.knowledge_base = json.load(f)
            print(f"[OK] Knowledge base loaded: {len(self.knowledge_base)} categories")
        except FileNotFoundError:
            print(f"[ERROR] knowledge_base.json not found at {knowledge_base_path}")
            raise
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON in knowledge_base.json: {e}")
            raise
        
        # Flatten knowledge base for retrieval
        self.activities = []
        for category, items in self.knowledge_base.items():
            if category != "crisis_resources":
                for item in items:
                    item['category'] = category
                    self.activities.append(item)
        
        print(f"[OK] Indexed {len(self.activities)} activities for RAG")
        
        # Create TF-IDF vectorizer for semantic search
        self.vectorizer = TfidfVectorizer()
        self.activity_texts = [
            f"{act.get('name', '')} {act.get('description', '')} {' '.join(act.get('best_for', []))}"
            for act in self.activities
        ]
        self.activity_vectors = self.vectorizer.fit_transform(self.activity_texts)
        
    def retrieve_relevant_activities(self, transcript: str, mood_score: float, 
                                    anxiety_score: float, top_k: int = 8) -> List[Dict]:
        """Retrieve most relevant activities using RAG"""
        
        # Create query from transcript + mood
        mood_description = self._describe_mood(mood_score, anxiety_score)
        query = f"{transcript} {mood_description}"
        
        # Vectorize query
        query_vector = self.vectorizer.transform([query])
        
        # Calculate similarity scores
        similarities = cosine_similarity(query_vector, self.activity_vectors).flatten()
        
        # Get top-k most relevant activities
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        relevant_activities = [self.activities[i] for i in top_indices]
        return relevant_activities
    
    def _describe_mood(self, mood_score: float, anxiety_score: float) -> str:
        """Convert scores to descriptive text"""
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
    
    def generate_plan(self, transcript: str, mood_score: float, 
                     anxiety_score: float, crisis_flag: bool) -> Dict:
        """Generate personalized plan using RAG + LLM"""
        
        print(f"\n[INFO] Generating wellness plan...")
        print(f"   Mood: {mood_score:.2f}, Anxiety: {anxiety_score:.2f}, Crisis: {crisis_flag}")
        
        # Step 1: Retrieve relevant activities from knowledge base
        relevant_activities = self.retrieve_relevant_activities(
            transcript, mood_score, anxiety_score, top_k=8
        )
        print(f"   Retrieved {len(relevant_activities)} relevant activities")
        
        # Step 2: Use LLM to create personalized plan (if available)
        if self.model:
            try:
                return self._generate_with_llm(
                    transcript, mood_score, anxiety_score, 
                    crisis_flag, relevant_activities
                )
            except Exception as e:
                print(f"[WARN] LLM generation failed: {e}")
                print(f"   Falling back to template-based plan")
                return self._get_fallback_plan(
                    mood_score, anxiety_score, crisis_flag, relevant_activities
                )
        else:
            print(f"   Using template-based plan (no Gemini API)")
            return self._get_fallback_plan(
                mood_score, anxiety_score, crisis_flag, relevant_activities
            )
    
    def _generate_with_llm(self, transcript: str, mood_score: float,
                          anxiety_score: float, crisis_flag: bool,
                          relevant_activities: List[Dict]) -> Dict:
        """Generate plan using Gemini LLM"""
        
        prompt = f"""You are a compassionate mental health assistant. Create a personalized wellness plan.

USER CONTEXT:
- Transcript: "{transcript}"
- Mood Score: {mood_score:.2f} (0=very negative, 1=very positive)
- Anxiety Score: {anxiety_score:.2f} (0=calm, 1=very anxious)
- Crisis Detected: {crisis_flag}

AVAILABLE ACTIVITIES:
{json.dumps(relevant_activities, indent=2)}

TASK: Create a warm, personalized wellness plan. Select 3-4 activities from the list above.

RETURN EXACTLY THIS JSON STRUCTURE (no markdown, no extra text):
{{
  "immediate_actions": ["Action 1 in 1-2 sentences", "Action 2", "Action 3"],
  "activities": ["Activity 1 description", "Activity 2", "Activity 3", "Activity 4"],
  "music_recommendation": {{
    "needed": true,
    "description": "Why music helps and what mood to target"
  }}
}}

Keep it warm, actionable, and encouraging. Use simple language."""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1000
                )
            )
            
            response_text = response.text.strip()
            
            # Clean up markdown if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            plan = json.loads(response_text)
            
            # Validate structure
            if not isinstance(plan.get("immediate_actions"), list):
                raise ValueError("Invalid plan structure: missing immediate_actions")
            if not isinstance(plan.get("activities"), list):
                raise ValueError("Invalid plan structure: missing activities")
            
            print(f"   [OK] LLM plan generated successfully")
            return plan
            
        except json.JSONDecodeError as e:
            print(f"   [ERROR] JSON decode error: {e}")
            print(f"   Response was: {response_text[:200]}...")
            raise
        except Exception as e:
            print(f"   [ERROR] LLM generation error: {e}")
            raise
    
    def _get_fallback_plan(self, mood_score: float, anxiety_score: float,
                          crisis_flag: bool, activities: List[Dict]) -> Dict:
        """Return a template-based plan if LLM fails"""
        
        # Generate immediate actions based on mood
        immediate_actions = []
        
        if crisis_flag or mood_score < 0.2:
            immediate_actions = [
                "Take slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 4.",
                "If you're feeling overwhelmed, reach out to someone you trust right now.",
                "Remember: This feeling will pass. You've gotten through difficult moments before."
            ]
        elif mood_score < 0.4:
            immediate_actions = [
                "Start with a simple breathing exercise to calm your nervous system.",
                "Do one small, manageable thing right now - even just washing your face.",
                "Be gentle with yourself. It's okay to not be okay sometimes."
            ]
        elif mood_score < 0.6:
            immediate_actions = [
                "Take a moment to notice your breathing and relax your shoulders.",
                "Consider doing a quick 5-minute activity to shift your energy.",
                "Stay hydrated and make sure you've eaten something today."
            ]
        else:
            immediate_actions = [
                "You're doing well! Keep this positive momentum going.",
                "Consider an activity that brings you joy or helps you relax.",
                "Take a moment to appreciate how you're feeling right now."
            ]
        
        # Convert activities to simple descriptions
        activity_descriptions = []
        for act in activities[:4]:
            name = act.get('name', 'Activity')
            desc = act.get('description', '')
            duration = act.get('duration_minutes', 5)
            
            if desc:
                activity_descriptions.append(f"{name}: {desc} ({duration} minutes)")
            else:
                steps = act.get('steps', [])
                if steps:
                    activity_descriptions.append(f"{name}: {', '.join(steps[:2])} ({duration} minutes)")
                else:
                    activity_descriptions.append(f"{name} ({duration} minutes)")
        
        # Music recommendation
        if anxiety_score > 0.6:
            music_desc = "Calming, slow-tempo music can help reduce anxiety and promote relaxation."
        elif mood_score < 0.4:
            music_desc = "Gentle, uplifting music can help improve your mood and provide comfort."
        else:
            music_desc = "Music that matches your current mood can be therapeutic and grounding."
        
        plan = {
            "immediate_actions": immediate_actions,
            "activities": activity_descriptions if activity_descriptions else [
                "Take 5 slow, deep breaths",
                "Drink a glass of water",
                "Step outside for fresh air if possible",
                "Write down one thing you're grateful for"
            ],
            "music_recommendation": {
                "needed": True,
                "description": music_desc
            }
        }
        
        print(f"   [OK] Fallback plan generated")
        return plan

# Global instance - will be initialized lazily
_rag_agent_instance = None

def get_rag_agent():
    """Get the RAG agent instance, initializing if needed."""
    global _rag_agent_instance
    if _rag_agent_instance is None:
        knowledge_base_path = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
        _rag_agent_instance = MentalHealthRAGAgent(knowledge_base_path)
        print(f"[OK] RAG Agent initialized")
    return _rag_agent_instance

class RAGAgentProxy:
    """Proxy that lazily initializes the RAG agent on first access."""
    def __getattr__(self, name):
        return getattr(get_rag_agent(), name)

rag_agent = RAGAgentProxy()
