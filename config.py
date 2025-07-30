# config.py (update)
import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'c66ad4d10b01fb4751a5cdb4c141f702f60aec839847591373b18e3a151d5c58'
    # Fix database path:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"sqlite:///{os.path.join(basedir, 'instance', 'app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    
    @staticmethod
    def init_app(app):
        # Create required directories
        for folder in [app.config['UPLOAD_FOLDER'], 
                      os.path.join(basedir, 'instance')]:
            if not os.path.exists(folder):
                os.makedirs(folder)