"""
Gmail API Service for OAuth 2.0 Authentication and Email Sending
Handles secure email sending using Gmail API instead of SMTP
"""

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64
import os
from dotenv import load_dotenv

load_dotenv()

class GmailService:
    """Service for Gmail OAuth 2.0 and email sending"""
    
    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    
    def __init__(self):
        """Initialize Gmail service with OAuth configuration"""
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/oauth2callback')
        
        if not self.client_id or not self.client_secret:
            print("Warning: Gmail OAuth credentials not configured")
        
        self.client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uris": [self.redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
    
    def get_authorization_url(self):
        """
        Generate OAuth authorization URL for user to authenticate
        
        Returns:
            tuple: (auth_url, state) - URL for user to visit and state token
        """
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.SCOPES,
                redirect_uri=self.redirect_uri
            )
            
            auth_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            
            return auth_url, state
        except Exception as e:
            print(f"Error generating authorization URL: {e}")
            raise
    
    def get_credentials_from_code(self, code, state):
        """
        Exchange authorization code for credentials
        
        Args:
            code (str): Authorization code from OAuth callback
            state (str): State token for verification
            
        Returns:
            Credentials: Google OAuth credentials
        """
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.SCOPES,
                redirect_uri=self.redirect_uri,
                state=state
            )
            
            flow.fetch_token(code=code)
            return flow.credentials
        except Exception as e:
            print(f"Error exchanging code for credentials: {e}")
            raise
    
    def send_email(self, credentials_dict, to_email, subject, body, resume_path=None, from_name=None):
        """
        Send email using Gmail API
        
        Args:
            credentials_dict (dict): OAuth credentials as dictionary
            to_email (str): Recipient email address
            subject (str): Email subject
            body (str): Email body
            resume_path (str, optional): Path to resume PDF to attach
            from_name (str, optional): Sender name for display
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Reconstruct credentials from dictionary
            credentials = Credentials(
                token=credentials_dict.get('token'),
                refresh_token=credentials_dict.get('refresh_token'),
                token_uri=credentials_dict.get('token_uri'),
                client_id=credentials_dict.get('client_id'),
                client_secret=credentials_dict.get('client_secret'),
                scopes=credentials_dict.get('scopes')
            )
            
            # Build Gmail service
            service = build('gmail', 'v1', credentials=credentials)
            
            # Create message
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            
            # Add body
            message.attach(MIMEText(body, 'plain'))
            
            # Attach resume if provided
            if resume_path and os.path.exists(resume_path):
                try:
                    with open(resume_path, 'rb') as f:
                        part = MIMEBase('application', 'pdf')
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename={os.path.basename(resume_path)}'
                        )
                        message.attach(part)
                except Exception as e:
                    print(f"Warning: Could not attach resume: {e}")
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            send_message = {'raw': raw_message}
            
            # Send email
            result = service.users().messages().send(
                userId='me',
                body=send_message
            ).execute()
            
            print(f"Email sent successfully to {to_email}. Message ID: {result.get('id')}")
            return True
            
        except HttpError as error:
            print(f"Gmail API error sending to {to_email}: {error}")
            return False
        except Exception as e:
            print(f"Error sending email to {to_email}: {e}")
            return False
    
    def verify_credentials(self, credentials_dict):
        """
        Verify that credentials are valid
        
        Args:
            credentials_dict (dict): OAuth credentials as dictionary
            
        Returns:
            bool: True if credentials are valid
        """
        try:
            credentials = Credentials(
                token=credentials_dict.get('token'),
                refresh_token=credentials_dict.get('refresh_token'),
                token_uri=credentials_dict.get('token_uri'),
                client_id=credentials_dict.get('client_id'),
                client_secret=credentials_dict.get('client_secret'),
                scopes=credentials_dict.get('scopes')
            )
            
            service = build('gmail', 'v1', credentials=credentials)
            # Try to get user profile to verify credentials
            service.users().getProfile(userId='me').execute()
            return True
        except Exception as e:
            print(f"Credentials verification failed: {e}")
            return False


# Singleton instance
_gmail_service = None

def get_gmail_service():
    """Get or create Gmail service instance"""
    global _gmail_service
    if _gmail_service is None:
        _gmail_service = GmailService()
    return _gmail_service
