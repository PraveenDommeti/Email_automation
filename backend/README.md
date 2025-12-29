# Backend Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp ../.env.example .env
```

Edit `.env` and add:

#### Gemini API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

#### Gmail OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:5000/oauth2callback`
   - Click "Create"
5. Copy Client ID and Client Secret to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

#### Flask Secret Key
Generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Add to `.env`:
```
FLASK_SECRET_KEY=generated_secret_key_here
```

### 3. Run the Backend

```bash
python app.py
```

The server will start on `http://localhost:5000`

## 📝 API Endpoints

### Authentication
- `GET /api/auth/gmail/authorize` - Get Gmail OAuth URL
- `GET /api/auth/gmail/status` - Check authentication status
- `POST /api/auth/gmail/disconnect` - Disconnect Gmail
- `POST /api/auth/gmail/test` - Send test email

### AI Generation
- `POST /api/ai/generate_email_ai` - Generate single email
- `POST /api/ai/generate_batch_emails` - Generate multiple emails

### Email Campaign
- `POST /upload` - Upload files
- `POST /send_emails` - Start email campaign
- `GET /progress` - Get campaign progress
- `POST /cancel_emails` - Cancel campaign
- `POST /send_test_email` - Send test email

### Health
- `GET /` - API status
- `GET /health` - Health check

## 🔧 Troubleshooting

### Gemini API Errors
- Verify API key is correct
- Check quota limits at https://makersuite.google.com/
- Ensure you have access to Gemini Pro model

### Gmail OAuth Errors
- Verify redirect URI matches exactly (including http/https)
- Check that Gmail API is enabled
- Ensure OAuth consent screen is configured
- For development, add your email to test users

### Import Errors
- Make sure you're in the backend directory
- Verify all dependencies are installed
- Check Python version (3.8+ required)

## 📊 Rate Limiting

Default: 150 emails per hour to prevent Gmail account flags

Adjust in `.env`:
```
MAX_EMAILS_PER_HOUR=150
```

## 🔐 Security Notes

- Never commit `.env` file
- Credentials stored only in session (temporary)
- Use HTTPS in production
- Regularly rotate API keys
