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
        "SUPABASE_KEY": "Supabase service role key",
        "SPOTIFY_CLIENT_ID": "Spotify API client ID",
        "SPOTIFY_CLIENT_SECRET": "Spotify API client secret",
        "GEMINI_API_KEY": "Google Gemini API key for wellness plan generation",
    }
    
    # Optional environment variables
    OPTIONAL_VARS = {
        "N8N_WEBHOOK_URL": "n8n webhook URL for wellness plan delivery",
        "N8N_CRISIS_WEBHOOK_URL": "n8n webhook URL for crisis alerts",
        "GROQ_API_KEY": "GROQ API key for transcription",
    }
    
    def __init__(self):
        self.env_path = None
        self.loaded = False
        
    def load_env(self) -> bool:
        """Load environment variables from .env file or system environment."""
        print("\n" + "=" * 60)
        print("NeuroSync Backend - Environment Loader")
        print("=" * 60 + "\n")
        
        # Try to find and load .env file (optional in production)
        possible_paths = [
            Path.cwd() / ".env",
            Path.cwd() / "backend" / ".env",
            Path(__file__).parent / ".env",
            Path("/backend/.env"),
        ]
        
        env_loaded_from_file = False
        for path in possible_paths:
            if path.exists():
                print(f"[INFO] Loading environment from: {path}")
                load_dotenv(path)
                self.env_path = path
                env_loaded_from_file = True
                print("[OK] Environment file loaded successfully\n")
                break
        
        if not env_loaded_from_file:
            print("[INFO] No .env file found - using system environment variables")
            print("[INFO] This is normal for production deployments (Railway, etc.)\n")
        
        self.loaded = True
        return True
    
    def validate_env(self) -> bool:
        """Validate that all required environment variables are present."""
        print("[INFO] Validating environment variables...")
        
        missing_vars = []
        
        # Check required variables
        for var_name, description in self.REQUIRED_VARS.items():
            value = os.getenv(var_name)
            if not value:
                missing_vars.append(var_name)
                print(f"[MISSING] {var_name}: {description}")
            else:
                # Mask sensitive values for security
                masked_value = "*" * 20 + value[-4:] if len(value) > 4 else "****"
                print(f"[OK] {var_name}: {masked_value}")
        
        if missing_vars:
            print("\n" + "=" * 60)
            print("CRITICAL ERROR: Missing required environment variables!")
            print("=" * 60)
            for var in missing_vars:
                print(f"  - {var}")
            print("\nPlease set these variables and try again.")
            print("=" * 60 + "\n")
            return False
        
        # Check optional variables
        print("\n[INFO] Optional variables:")
        for var_name, description in self.OPTIONAL_VARS.items():
            value = os.getenv(var_name)
            if value:
                masked_value = "*" * 20 + value[-4:] if len(value) > 4 else "****"
                print(f"[OK] {var_name}: {masked_value}")
            else:
                print(f"[SKIP] {var_name}: Not set (optional)")
        
        print("\n[OK] All required environment variables validated successfully!\n")
        return True

def load_environment() -> bool:
    """Main function to load and validate environment."""
    loader = EnvLoader()
    
    if not loader.load_env():
        return False
    
    if not loader.validate_env():
        return False
    
    print("=" * 60)
    print("Environment loaded successfully!")
    print("=" * 60 + "\n")
    return True

if __name__ == "__main__":
    success = load_environment()
    sys.exit(0 if success else 1)
