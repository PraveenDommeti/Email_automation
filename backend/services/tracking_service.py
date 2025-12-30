"""
Tracking Service for preventing duplicate emails using SQLite
"""

import sqlite3
import os
import logging
from datetime import datetime

class TrackingService:
    """Service to track sent emails and prevent duplicates"""
    
    DB_NAME = 'tracking.db'
    
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), self.DB_NAME)
        self._init_db()

    def _init_db(self):
        """Initialize database with required tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create sent_emails table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sent_emails (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT,
                    subject TEXT,
                    campaign_id TEXT
                )
            ''')
            
            # Create index on email for faster lookups
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_email ON sent_emails(email)
            ''')
            
            conn.commit()
            conn.close()
        except Exception as e:
            logging.error(f"Database initialization error: {e}")

    def is_email_sent(self, email, campaign_id=None):
        """
        Check if an email has already been sent
        
        Args:
            email (str): Email address to check
            campaign_id (str, optional): Specific campaign to check against
            
        Returns:
            bool: True if already sent, False otherwise
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if campaign_id:
                cursor.execute(
                    "SELECT 1 FROM sent_emails WHERE email = ? AND campaign_id = ? AND status = 'sent'", 
                    (email.lower(), campaign_id)
                )
            else:
                # Global check - if sent at all (user's request: "No repeats")
                cursor.execute(
                    "SELECT 1 FROM sent_emails WHERE email = ? AND status = 'sent'", 
                    (email.lower(),)
                )
                
            result = cursor.fetchone()
            conn.close()
            return result is not None
        except Exception as e:
            logging.error(f"Error checking email status: {e}")
            return False

    def log_email(self, email, status='sent', subject=None, campaign_id=None):
        """
        Log an email attempt
        
        Args:
            email (str): Email address
            status (str): Status of sending (sent/failed)
            subject (str): Email subject
            campaign_id (str): Campaign identifier
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                '''
                INSERT INTO sent_emails (email, status, subject, campaign_id, sent_at)
                VALUES (?, ?, ?, ?, ?)
                ''',
                (email.lower(), status, subject, campaign_id, datetime.now())
            )
            
            conn.commit()
            conn.close()
        except Exception as e:
            logging.error(f"Error logging email: {e}")

    def get_stats(self):
        """Get simple stats"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM sent_emails WHERE status = 'sent'")
            total_sent = cursor.fetchone()[0]
            
            conn.close()
            return {'total_unique_sent': total_sent}
        except Exception:
            return {'total_unique_sent': 0}

# Singleton
_tracking_service = None

def get_tracking_service():
    global _tracking_service
    if _tracking_service is None:
        _tracking_service = TrackingService()
    return _tracking_service
