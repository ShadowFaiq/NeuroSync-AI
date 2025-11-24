import os
import requests
import base64
from typing import Optional

class SpotifyService:
    def __init__(self):
        self.client_id = os.getenv("SPOTIFY_CLIENT_ID")
        self.client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        self.access_token = None
    
    def get_access_token(self) -> str:
        """Get Spotify access token using Client Credentials flow"""
        if self.access_token:
            # In a real app, we should check expiry. For now, simple caching.
            return self.access_token
        
        if not self.client_id or not self.client_secret:
            print("❌ Spotify credentials not found in environment variables")
            return None

        auth_str = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_str.encode("utf-8")
        auth_base64 = base64.b64encode(auth_bytes).decode("utf-8")
        
        try:
            response = requests.post(
                "https://accounts.spotify.com/api/token",
                headers={"Authorization": f"Basic {auth_base64}"},
                data={"grant_type": "client_credentials"},
                timeout=10
            )
            
            if response.status_code == 200:
                self.access_token = response.json()["access_token"]
                return self.access_token
            else:
                print(f"❌ Spotify auth failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Spotify auth error: {e}")
            return None
    
    def get_playlist(self, mood_score: float, anxiety_score: float) -> Optional[str]:
        """Get mood-appropriate Spotify playlist URL"""
        token = self.get_access_token()
        if not token:
            return None
        
        # Determine search query based on mood
        if anxiety_score > 0.6:
            query = "peaceful calming meditation ambient sleep"
        elif mood_score < 0.3:
            query = "uplifting hopeful positive encouraging happy"
        elif mood_score < 0.5:
            query = "relaxing chill lo-fi focus study"
        else:
            query = "feel good happy upbeat positive vibes"
        
        try:
            response = requests.get(
                f"https://api.spotify.com/v1/search",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "q": query,
                    "type": "playlist",
                    "limit": 1
                },
                timeout=10
            )
            
            if response.status_code == 200:
                playlists = response.json().get("playlists", {}).get("items", [])
                if playlists:
                    playlist_url = playlists[0]["external_urls"]["spotify"]
                    playlist_name = playlists[0]["name"]
                    print(f"🎵 Found playlist: {playlist_name}")
                    return playlist_url
            
            print(f"❌ Spotify search failed: {response.text}")
            return self._get_fallback_playlist(mood_score)
            
        except Exception as e:
            print(f"❌ Spotify search error: {e}")
            return self._get_fallback_playlist(mood_score)

    def _get_fallback_playlist(self, mood_score: float) -> str:
        """Return a fallback playlist based on mood"""
        print("⚠️ Using fallback playlist")
        if mood_score < 0.5:
            # Calming / Stress Relief
            return "https://open.spotify.com/playlist/37i9dQZF1DWZqd5JICZI0u"
        else:
            # Upbeat / Happy
            return "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfCUTxSu"

    def get_recommendations(self, mood_score: float, anxiety_score: float) -> list:
        """Get mood-appropriate track recommendations"""
        token = self.get_access_token()
        if not token:
            return self._get_fallback_tracks(mood_score)
        
        # Determine seed genres and parameters based on mood
        seed_genres = "pop,happy"
        target_valence = 0.8
        target_energy = 0.7
        
        if anxiety_score > 0.6:
            seed_genres = "ambient,classical,sleep"
            target_valence = 0.5
            target_energy = 0.3
        elif mood_score < 0.3:
            seed_genres = "acoustic,piano,chill"
            target_valence = 0.6  # Uplifting
            target_energy = 0.5
        elif mood_score < 0.5:
            seed_genres = "lo-fi,study,focus"
            target_valence = 0.5
            target_energy = 0.4
            
        try:
            response = requests.get(
                f"https://api.spotify.com/v1/recommendations",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "seed_genres": seed_genres,
                    "target_valence": target_valence,
                    "target_energy": target_energy,
                    "limit": 12
                },
                timeout=10
            )
            
            if response.status_code == 200:
                tracks = response.json().get("tracks", [])
                return tracks
            
            print(f"❌ Spotify recommendations failed: {response.text}")
            return self._get_fallback_tracks(mood_score)
            
        except Exception as e:
            print(f"❌ Spotify recommendations error: {e}")
            return self._get_fallback_tracks(mood_score)

    def _get_fallback_tracks(self, mood_score: float) -> list:
        """Return fallback tracks if API fails"""
        # Mock track objects
        return [
            {
                "id": "1",
                "name": "Weightless",
                "artists": [{"name": "Marconi Union"}],
                "album": {"images": [{"url": "https://i.scdn.co/image/ab67616d0000b2733d92b2ad5222b27d49669046"}]},
                "external_urls": {"spotify": "https://open.spotify.com/track/6kLCHFM39wkFjOuyPGLGeQ"}
            },
            {
                "id": "2",
                "name": "Clair de Lune",
                "artists": [{"name": "Claude Debussy"}],
                "album": {"images": [{"url": "https://i.scdn.co/image/ab67616d0000b273955486525fa502e86e42220e"}]},
                "external_urls": {"spotify": "https://open.spotify.com/track/6N7JzjzDikITTLQAxpYLIT"}
            },
            {
                "id": "3",
                "name": "River Flows In You",
                "artists": [{"name": "Yiruma"}],
                "album": {"images": [{"url": "https://i.scdn.co/image/ab67616d0000b273d6d48b102e57e5e0636d30df"}]},
                "external_urls": {"spotify": "https://open.spotify.com/track/2agBDIr9MYDU4QKLMoAE0g"}
            }
        ]

# Global instance - lazy loaded
_spotify_service_instance = None

def get_spotify_service():
    """Get the Spotify service instance, initializing if needed."""
    global _spotify_service_instance
    if _spotify_service_instance is None:
        _spotify_service_instance = SpotifyService()
        print(f"[OK] Spotify service initialized")
    return _spotify_service_instance

class SpotifyServiceProxy:
    """Proxy that lazily initializes the Spotify service on first access."""
    def __getattr__(self, name):
        return getattr(get_spotify_service(), name)

spotify_service = SpotifyServiceProxy()
