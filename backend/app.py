"""
Main Flask Application - Email Automation System with AI and Gmail OAuth
"""

from flask import Flask, request, jsonify, send_file, session, redirect
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import sys
import threading
import time
import csv

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from services.file_service import FileService
from services.gmail_service import get_gmail_service
from services.gemini_service import get_gemini_service
from routes.ai_routes import ai_bp
from routes.auth_routes import auth_bp

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
Config.init_app(app)

# Enable CORS for React frontend
CORS(app, 
     supports_credentials=True, 
     origins=Config.CORS_ORIGINS,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Register blueprints
app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Global variables for progress tracking
email_progress = {
    'status': 'idle',
    'current': 0,
    'total': 0,
    'sent': 0,
    'failed': 0,
    'logs': [],
    'cancelled': False
}

# Email sending thread reference
email_thread = None

@app.route('/')
def index():
    """API status endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'Email Automation API with AI',
        'version': '2.0',
        'features': ['Gemini AI', 'Gmail OAuth', 'File Upload', 'Progress Tracking']
    })

# ============================================================================
# ROOT-LEVEL OAUTH ROUTES (Required because Google redirects to /oauth2callback)
# ============================================================================

@app.route('/oauth2callback')
def oauth2callback():
    """
    Handle OAuth callback from Google at root level.
    Google redirects to http://localhost:5000/oauth2callback
    This route processes the OAuth response and stores credentials.
    """
    from google_auth_oauthlib.flow import Flow
    import os
    
    # Allow HTTP for localhost (development only)
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        # Check for OAuth errors
        if error:
            print(f"OAuth error: {error}")
            return redirect(f'http://localhost:3000?auth=error&message={error}')
        
        # Verify state token
        stored_state = session.get('oauth_state')
        if state != stored_state:
            print(f"Invalid state parameter. Received: {state}, Expected: {stored_state}")
            return redirect('http://localhost:3000?auth=error&message=invalid_state')
        
        # Exchange code for credentials
        gmail_service = get_gmail_service()
        credentials = gmail_service.get_credentials_from_code(code, state)
        
        # Store credentials in session
        session['gmail_credentials'] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': list(credentials.scopes) if credentials.scopes else []
        }
        
        print("✅ Gmail OAuth successful - credentials stored in session")
        print(f"Gmail connected: {session.get('gmail_credentials') is not None}")
        
        # Redirect to frontend with success
        return redirect('http://localhost:3000?auth=success')
        
    except Exception as e:
        print(f"❌ Error in OAuth callback: {e}")
        import traceback
        traceback.print_exc()
        return redirect(f'http://localhost:3000?auth=error&message=callback_failed')

@app.route('/login')
def login():
    """
    Initiate Gmail OAuth login flow.
    Redirects user to Google consent screen.
    """
    try:
        gmail_service = get_gmail_service()
        auth_url, state = gmail_service.get_authorization_url()
        
        # Store state in session for verification
        session['oauth_state'] = state
        
        print(f"🔐 Starting OAuth flow, redirecting to Google...")
        return redirect(auth_url)
        
    except Exception as e:
        print(f"❌ Error initiating OAuth: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Please configure Gmail OAuth credentials in .env file'
        }), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Upload file (resume or email list)
    
    Form data:
        - file: File to upload
    
    Returns:
        JSON with file info
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        file_service = FileService()
        filepath = file_service.save_uploaded_file(file, app.config['UPLOAD_FOLDER'])
        
        if filepath:
            file_info = file_service.get_file_info(filepath)
            return jsonify({
                'success': True,
                'filename': file_info['filename'],
                'path': filepath,
                'size_mb': file_info['size_mb']
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid file type'
            }), 400
            
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/send_emails', methods=['POST'])
def send_emails():
    """
    Start email sending campaign
    
    Request JSON:
        - csv_file (str): Path to CSV file with emails
        - resume_file (str): Path to resume PDF
        - subject (str): Email subject
        - body (str): Email body
        - max_emails (int): Maximum emails to send
        - use_ai (bool): Whether to use AI for personalization
    
    Returns:
        JSON with campaign start status
    """
    global email_progress, email_thread
    
    try:
        data = request.json
        
        # Check Gmail authentication
        if 'gmail_credentials' not in session:
            return jsonify({
                'success': False,
                'error': 'Not authenticated',
                'message': 'Please connect your Gmail account first'
            }), 401
        
        # Validate required fields
        csv_file = data.get('csv_file')
        resume_file = data.get('resume_file')
        subject = data.get('subject')
        body = data.get('body')
        max_emails = int(data.get('max_emails', 30))
        use_ai = data.get('use_ai', False)
        
        if not csv_file or not os.path.exists(csv_file):
            return jsonify({
                'success': False,
                'error': 'CSV file not found'
            }), 400
        
        # Reset progress
        email_progress = {
            'status': 'running',
            'current': 0,
            'total': 0,
            'sent': 0,
            'failed': 0,
            'logs': [],
            'cancelled': False
        }
        
        # Start email sending in background thread
        email_thread = threading.Thread(
            target=send_emails_worker,
            args=(csv_file, resume_file, subject, body, max_emails, use_ai, session.get('gmail_credentials'))
        )
        email_thread.daemon = True
        email_thread.start()
        
        return jsonify({
            'success': True,
            'message': 'Email campaign started'
        })
        
    except Exception as e:
        print(f"Error starting email campaign: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def send_emails_worker(csv_file, resume_file, subject, body, max_emails, use_ai, credentials):
    """Background worker for sending emails"""
    global email_progress
    
    try:
        # Extract emails from CSV
        file_service = FileService()
        recipients = file_service.extract_emails_from_csv(csv_file, max_emails)
        
        if not recipients:
            email_progress['status'] = 'error'
            email_progress['logs'].append('❌ No valid emails found in CSV file')
            return
        
        email_progress['total'] = len(recipients)
        email_progress['logs'].append(f'📧 Found {len(recipients)} recipients')
        
        # Get services
        gmail_service = get_gmail_service()
        gemini_service = None
        if use_ai:
            try:
                gemini_service = get_gemini_service()
                email_progress['logs'].append('🤖 AI personalization enabled')
            except:
                email_progress['logs'].append('⚠️ AI not available, using template')
        
        # Send emails with rate limiting
        delay_between_emails = 3600 / app.config['MAX_EMAILS_PER_HOUR']
        
        for idx, recipient in enumerate(recipients):
            # Check if cancelled
            if email_progress.get('cancelled'):
                email_progress['logs'].append('🛑 Campaign cancelled by user')
                break
            
            try:
                recipient_email = recipient['email']
                recipient_name = recipient.get('name', 'Hiring Manager')
                company = recipient.get('company', '')
                
                # Generate personalized content if AI enabled
                email_subject = subject
                email_body = body
                
                if use_ai and gemini_service:
                    try:
                        email_subject = gemini_service.generate_subject(recipient_name, company)
                        email_body = gemini_service.generate_email(recipient_name, company, resume_text=None)
                        email_progress['logs'].append(f'🤖 AI content generated for {recipient_name}')
                    except Exception as e:
                        email_progress['logs'].append(f'⚠️ AI generation failed for {recipient_name}, using template')
                
                # Send email
                email_progress['logs'].append(f'📤 Sending {idx + 1}/{len(recipients)} to {recipient_email}...')
                
                success = gmail_service.send_email(
                    credentials,
                    recipient_email,
                    email_subject,
                    email_body,
                    resume_file
                )
                
                if success:
                    email_progress['sent'] += 1
                    email_progress['logs'].append(f'✅ Email sent to {recipient_email}')
                else:
                    email_progress['failed'] += 1
                    email_progress['logs'].append(f'❌ Failed to send to {recipient_email}')
                
                email_progress['current'] += 1
                
                # Rate limiting delay
                if idx < len(recipients) - 1:
                    time.sleep(delay_between_emails)
                
            except Exception as e:
                email_progress['failed'] += 1
                email_progress['current'] += 1
                email_progress['logs'].append(f'❌ Error sending to {recipient.get("email", "unknown")}: {str(e)}')
        
        # Campaign complete
        if not email_progress.get('cancelled'):
            email_progress['status'] = 'completed'
            email_progress['logs'].append(f'✨ Campaign completed: {email_progress["sent"]} sent, {email_progress["failed"]} failed')
        
    except Exception as e:
        email_progress['status'] = 'error'
        email_progress['logs'].append(f'❌ Campaign error: {str(e)}')
        print(f"Email worker error: {e}")

@app.route('/progress', methods=['GET'])
def get_progress():
    """Get current email sending progress"""
    return jsonify(email_progress)

@app.route('/cancel_emails', methods=['POST'])
def cancel_emails():
    """Cancel ongoing email campaign"""
    global email_progress
    
    if email_progress['status'] == 'running':
        email_progress['cancelled'] = True
        email_progress['status'] = 'cancelled'
        return jsonify({
            'success': True,
            'message': 'Email campaign cancelled'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'No active campaign to cancel'
        }), 400

@app.route('/send_test_email', methods=['POST'])
def send_test_email():
    """
    Send a test email
    
    Request JSON:
        - test_email (str): Email to send test to
        - subject (str): Email subject
        - body (str): Email body
        - resume_file (str, optional): Resume to attach
    
    Returns:
        JSON with test result
    """
    try:
        if 'gmail_credentials' not in session:
            return jsonify({
                'success': False,
                'error': 'Not authenticated'
            }), 401
        
        data = request.json
        test_email = data.get('test_email')
        subject = data.get('subject', 'Test Email')
        body = data.get('body', 'This is a test email.')
        resume_file = data.get('resume_file')
        
        if not test_email:
            return jsonify({
                'success': False,
                'error': 'No test email provided'
            }), 400
        
        # Send test email
        gmail_service = get_gmail_service()
        success = gmail_service.send_email(
            session.get('gmail_credentials'),
            test_email,
            subject,
            body,
            resume_file
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Test email sent to {test_email}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to send test email'
            }), 500
            
    except Exception as e:
        print(f"Test email error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'services': {
            'gemini_ai': os.getenv('GEMINI_API_KEY') is not None,
            'gmail_oauth': os.getenv('GOOGLE_CLIENT_ID') is not None,
            'gmail_authenticated': 'gmail_credentials' in session
        }
    })

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Email Automation System - AI Powered")
    print("=" * 60)
    print(f"📁 Upload folder: {app.config['UPLOAD_FOLDER']}")
    print(f"🤖 Gemini AI: {'✅ Configured' if os.getenv('GEMINI_API_KEY') else '❌ Not configured'}")
    print(f"📧 Gmail OAuth: {'✅ Configured' if os.getenv('GOOGLE_CLIENT_ID') else '❌ Not configured'}")
    print(f"🌐 CORS Origins: {', '.join(Config.CORS_ORIGINS)}")
    print("=" * 60)
    print("Starting server on http://localhost:5000")
    print("=" * 60)
    
    app.run(debug=True, port=5000, host='0.0.0.0')
