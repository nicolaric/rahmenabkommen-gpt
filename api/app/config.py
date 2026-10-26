import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///data.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Shared secret the UI server sends on write requests (see app/auth.py)
    INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN")
