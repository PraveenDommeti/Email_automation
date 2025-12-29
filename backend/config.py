import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    # File Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'pdf', 'csv', 'xlsx'}
    
    # Gemini AI
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # Gmail OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/oauth2callback')
    
    # Email Settings
    MAX_EMAILS_PER_HOUR = int(os.getenv('MAX_EMAILS_PER_HOUR', 150))
    
    # CORS
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173']
    
    @staticmethod
    def init_app(app):
        """Initialize application with config"""
        # Create upload folder if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
