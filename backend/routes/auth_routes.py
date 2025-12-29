"""
Auth Routes - Endpoints for Gmail OAuth 2.0 authentication
"""

from flask import Blueprint, request, jsonify, session, redirect
from services.gmail_service import get_gmail_service

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/gmail/authorize', methods=['GET'])
def gmail_authorize():
    """
    Initiate Gmail OAuth flow
    
    Returns:
        JSON with authorization URL
    """
    try:
        gmail_service = get_gmail_service()
        auth_url, state = gmail_service.get_authorization_url()
        
        # Store state in session for verification
        session['oauth_state'] = state
        
        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'state': state
        })
        
    except Exception as e:
        print(f"Error initiating OAuth: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Please configure Gmail OAuth credentials in .env file'
        }), 500

@auth_bp.route('/oauth2callback', methods=['GET'])
def oauth2callback():
    """
    Handle OAuth callback from Google
    
    Query params:
        - code: Authorization code
        - state: State token for verification
    
    Redirects to frontend with success/error
    """
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        # Check for OAuth errors
        if error:
            print(f"OAuth error: {error}")
            return redirect('http://localhost:3000?auth=error&message=' + error)
        
        # Verify state token
        if state != session.get('oauth_state'):
            print("Invalid state parameter")
            return redirect('http://localhost:3000?auth=error&message=invalid_state')
        
        # Exchange code for credentials
        gmail_service = get_gmail_service()
        credentials = gmail_service.get_credentials_from_code(code, state)
        
        # Store credentials in session (temporary storage)
        session['gmail_credentials'] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        print("Gmail OAuth successful - credentials stored in session")
        
        # Redirect to frontend with success
        return redirect('http://localhost:3000?auth=success')
        
    except Exception as e:
        print(f"Error in OAuth callback: {e}")
        return redirect('http://localhost:3000?auth=error&message=callback_failed')

@auth_bp.route('/gmail/status', methods=['GET'])
def gmail_status():
    """
    Check if Gmail is authenticated
    
    Returns:
        JSON with authentication status
    """
    try:
        authenticated = 'gmail_credentials' in session
        
        # If authenticated, verify credentials are still valid
        if authenticated:
            gmail_service = get_gmail_service()
            credentials = session.get('gmail_credentials')
            
            # Quick validation
            if not credentials or not credentials.get('token'):
                authenticated = False
                session.pop('gmail_credentials', None)
        
        return jsonify({
            'success': True,
            'authenticated': authenticated,
            'has_credentials': 'gmail_credentials' in session
        })
        
    except Exception as e:
        print(f"Error checking Gmail status: {e}")
        return jsonify({
            'success': False,
            'authenticated': False,
            'error': str(e)
        }), 500

@auth_bp.route('/gmail/disconnect', methods=['POST'])
def gmail_disconnect():
    """
    Disconnect Gmail account (remove credentials from session)
    
    Returns:
        JSON with success status
    """
    try:
        if 'gmail_credentials' in session:
            session.pop('gmail_credentials')
            print("Gmail credentials removed from session")
        
        return jsonify({
            'success': True,
            'message': 'Gmail account disconnected'
        })
        
    except Exception as e:
        print(f"Error disconnecting Gmail: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/gmail/test', methods=['POST'])
def gmail_test():
    """
    Test Gmail connection by sending a test email
    
    Request JSON:
        - test_email (str): Email address to send test to
    
    Returns:
        JSON with test result
    """
    try:
        if 'gmail_credentials' not in session:
            return jsonify({
                'success': False,
                'error': 'Not authenticated',
                'message': 'Please connect your Gmail account first'
            }), 401
        
        data = request.json
        test_email = data.get('test_email')
        
        if not test_email:
            return jsonify({
                'success': False,
                'error': 'No test email provided'
            }), 400
        
        # Send test email
        gmail_service = get_gmail_service()
        credentials = session.get('gmail_credentials')
        
        success = gmail_service.send_email(
            credentials,
            test_email,
            'Test Email - Gmail OAuth Integration',
            'This is a test email to verify your Gmail OAuth integration is working correctly.\n\nIf you received this, your setup is successful!',
            None
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Test email sent successfully to {test_email}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to send test email',
                'message': 'Check server logs for details'
            }), 500
            
    except Exception as e:
        print(f"Error sending test email: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
