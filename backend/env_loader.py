"""
Robust environment variable loader for NeuroSync backend.

This module ensures that .env files are loaded correctly regardless of
the working directory from which the application is run.
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
        """
        Find the .env file in the backend directory.
        
        This method tries multiple strategies to locate the .env file:
        1. Same directory as this file (env_loader.py)
        2. Parent of current working directory / backend
        3. Current working directory
        
        Returns:
            Path to the .env file
            
        Raises:
            FileNotFoundError: If .env file cannot be found
        """
        # Strategy 1: Same directory as this file (most reliable)
        backend_dir = Path(__file__).parent
        env_path = backend_dir / '.env'
        
        if env_path.exists():
            return env_path
        
        # Strategy 2: Try from current working directory
        cwd = Path.cwd()
        
        # If we're in the project root, try backend/.env
        potential_path = cwd / 'backend' / '.env'
        if potential_path.exists():
            return potential_path
        
        # If we're in the backend directory
        potential_path = cwd / '.env'
        if potential_path.exists():
            return potential_path
        
        # Strategy 3: Try parent directory
        potential_path = cwd.parent / 'backend' / '.env'
        if potential_path.exists():
            return potential_path
        
        # If nothing works, raise an error with helpful message
        raise FileNotFoundError(
            f"Could not find .env file. Searched in:\n"
            f"  1. {backend_dir / '.env'}\n"
            f"  2. {cwd / 'backend' / '.env'}\n"
            f"  3. {cwd / '.env'}\n"
            f"  4. {cwd.parent / 'backend' / '.env'}\n"
            f"\nPlease ensure backend/.env exists in your project."
        )
    
    def load(self) -> bool:
        """
        Load environment variables from .env file.
        
        Returns:
            True if loaded successfully, False otherwise
        """
        try:
            self.env_path = self.find_env_file()
            print(f"[INFO] Loading environment from: {self.env_path}")
            
            # Load the .env file
            load_dotenv(dotenv_path=self.env_path, override=True)
            
            print(f"[OK] Environment file loaded successfully")
            return True
            
        except FileNotFoundError as e:
            print(f"[ERROR] {e}")
            return False
        except Exception as e:
            print(f"[ERROR] Failed to load .env file: {e}")
            return False
    
    def validate(self) -> bool:
        """
        Validate that all required environment variables are present.
        
        Returns:
            True if all required variables are present, False otherwise
        """
        print(f"\n[INFO] Validating environment variables...")
        
        all_valid = True
        self.missing_vars = []
        
        # Check required variables
        for var_name, description in self.REQUIRED_VARS.items():
            value = os.getenv(var_name)
            
            if not value:
                print(f"[ERROR] Missing required variable: {var_name}")
                print(f"        Description: {description}")
                self.missing_vars.append(var_name)
                all_valid = False
            elif value.startswith("your_") or value == "":
                # Check for placeholder values
                print(f"[ERROR] Variable {var_name} has placeholder value: {value}")
                print(f"        Description: {description}")
                self.missing_vars.append(var_name)
                all_valid = False
            else:
                # Mask sensitive values for display
                masked_value = self._mask_value(value)
                print(f"[OK] {var_name}: {masked_value}")
                self.loaded_vars[var_name] = value
        
        # Check optional variables (just report, don't fail)
        print(f"\n[INFO] Optional variables:")
        for var_name, description in self.OPTIONAL_VARS.items():
            value = os.getenv(var_name)
            if value:
                masked_value = self._mask_value(value)
                print(f"[OK] {var_name}: {masked_value}")
                self.loaded_vars[var_name] = value
            else:
                print(f"[WARN] {var_name}: Not set ({description})")
        
        if not all_valid:
            print(f"\n{'='*60}")
            print(f"[ERROR] Environment validation FAILED!")
            print(f"{'='*60}")
            print(f"\nMissing or invalid variables:")
            for var in self.missing_vars:
                print(f"  - {var}: {self.REQUIRED_VARS[var]}")
            print(f"\nPlease update your backend/.env file with valid values.")
            print(f"See backend/.env.example for the correct format.")
            print(f"{'='*60}\n")
            return False
        
        print(f"\n[OK] All required environment variables validated successfully!\n")
        return True
    
    def _mask_value(self, value: str) -> str:
        """
        Mask sensitive values for display.
        
        Args:
            value: The value to mask
            
        Returns:
            Masked string showing only last 4 characters
        """
        if len(value) <= 4:
            return "***"
        return f"{'*' * min(20, len(value) - 4)}{value[-4:]}"
    
    def get_summary(self) -> Dict[str, any]:
        """
        Get a summary of loaded environment variables.
        
        Returns:
            Dictionary with loading status and variable info
        """
        return {
            "env_file_path": str(self.env_path) if self.env_path else None,
            "loaded_count": len(self.loaded_vars),
            "missing_count": len(self.missing_vars),
            "missing_vars": self.missing_vars,
        }


# Global instance - this ensures we only load once
_env_loader = None
_initialized = False


def load_and_validate_env() -> bool:
    """
    Load and validate environment variables.
    
    This is the main function to call from your application.
    It ensures the .env file is loaded and all required variables are present.
    
    Returns:
        True if successful
        
    Raises:
        ValueError: If required environment variables are missing
    """
    global _env_loader
    
    if _env_loader is None:
        _env_loader = EnvLoader()
    
    # Load the .env file
    if not _env_loader.load():
        raise ValueError("Failed to load .env file. See error messages above.")
    
    # Validate required variables
    if not _env_loader.validate():
        raise ValueError(
            f"Missing required environment variables: {', '.join(_env_loader.missing_vars)}\n"
            f"Please check backend/.env and ensure all required variables are set."
        )
    
    return True


def get_env_summary() -> Dict[str, any]:
    """Get a summary of the environment loading status."""
    global _env_loader
    if _env_loader is None:
        return {"error": "Environment not loaded yet"}
    return _env_loader.get_summary()


def ensure_env_loaded():
    """
    Ensure environment variables are loaded.
    This function is idempotent - it only loads once.
    Call this at the start of your application.
    """
    global _initialized
    
    if _initialized:
        return True
    
    try:
        print(f"\n{'='*60}")
        print(f"NeuroSync Backend - Environment Loader")
        print(f"{'='*60}\n")
        load_and_validate_env()
        print(f"{'='*60}")
        print(f"Environment loaded successfully!")
        print(f"{'='*60}\n")
        _initialized = True
        return True
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"CRITICAL ERROR: Environment loading failed!")
        print(f"{'='*60}")
        print(f"\nError: {e}\n")
        print(f"The application cannot start without valid environment variables.")
        print(f"Please fix the issues above and try again.\n")
        print(f"{'='*60}\n")
        raise  # Re-raise to allow app.py to handle it
