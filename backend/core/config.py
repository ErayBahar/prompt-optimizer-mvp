import os
from dotenv import load_dotenv

# loading .env
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Prompt Refiner MVP"
    VERSION: str = "1.0.0"
    
    # API keys
    NEBIUS_API_KEY: str = os.getenv("NEBIUS_API_KEY")
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS") # will be json path
    
    # model settings
    NEBIUS_MODEL: str = "openai/gpt-oss-20b"

settings = Settings()