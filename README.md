# Email Automation System - AI Powered 🚀

A modern, AI-powered email automation platform for sending personalized cold emails to job recruiters. Built with React, Flask, Gemini AI, and Gmail OAuth 2.0.

## ✨ Features

- 🤖 **AI-Powered Personalization** - Generate personalized emails using Google's Gemini AI
- 🔐 **Secure Gmail OAuth 2.0** - Send emails from your Gmail account without storing passwords
- 📤 **File Upload** - Easy resume and email list uploads
- 📊 **Real-time Progress Tracking** - Monitor campaign progress live
- 📝 **Campaign Logs** - Detailed logs of all email activities
- 🎨 **Modern UI** - Beautiful, responsive dark-themed interface
- ♨️ **Rate Limiting** - Prevents Gmail account flags (150 emails/hour)

## 🏗️ Architecture

```
├── backend/              # Flask API server
│   ├── services/        # Gemini AI & Gmail OAuth services
│   ├── routes/          # API endpoints
│   └── app.py           # Main application
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   └── services/    # API client
│   └── package.json
│
└── uploads/             # File storage
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Gmail account
- Gemini API key
- Google Cloud project with Gmail API enabled

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp ../.env.example .env

# Edit .env and add your API keys
# - GEMINI_API_KEY
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - FLASK_SECRET_KEY

# Run backend
python app.py
```

Backend will start on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

Frontend will start on `http://localhost:3000`

## 📖 Detailed Setup

### Get Gemini API Key

1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

### Setup Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `http://localhost:5000/oauth2callback`
6. Copy Client ID and Secret to `.env`

See `backend/README.md` for detailed instructions.

## 🎯 Usage

1. **Connect Gmail** - Authenticate with your Gmail account
2. **Upload Files** - Upload your resume (PDF) and email list (CSV)
3. **Generate AI Email** - Use Gemini AI to create personalized content
4. **Preview & Edit** - Review and customize the email
5. **Send Campaign** - Start sending emails with real-time tracking

## 📊 CSV Format

Your email list CSV should have these columns:

```csv
SNo,Name,Email,Company
1,John Doe,john@company.com,TechCorp
2,Jane Smith,jane@startup.com,StartupXYZ
```

## 🔐 Security

- ✅ OAuth 2.0 (no password storage)
- ✅ Session-based credentials (temporary)
- ✅ Environment variables for secrets
- ✅ CORS protection
- ✅ Rate limiting

## 📝 API Endpoints

### Authentication
- `GET /api/auth/gmail/authorize` - Get OAuth URL
- `GET /api/auth/gmail/status` - Check auth status
- `POST /api/auth/gmail/disconnect` - Disconnect Gmail

### AI Generation
- `POST /api/ai/generate_email_ai` - Generate email with AI

### Campaign
- `POST /upload` - Upload files
- `POST /send_emails` - Start campaign
- `GET /progress` - Get progress
- `POST /cancel_emails` - Cancel campaign

## 🛠️ Tech Stack

**Backend:**
- Flask - Web framework
- Gemini AI - Email generation
- Gmail API - Email sending
- OAuth 2.0 - Authentication

**Frontend:**
- React - UI framework
- Vite - Build tool
- Axios - HTTP client
- React Icons - Icons

## 📦 Project Files

- `IMPLEMENTATION_PLAN.md` - Detailed implementation guide
- `backend/README.md` - Backend setup guide
- `frontend/README.md` - Frontend setup guide
- `.env.example` - Environment variables template

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License

## 🙏 Acknowledgments

- Google Gemini AI for email generation
- Gmail API for secure email sending
- React and Flask communities

---

**⚠️ Important:** Never commit your `.env` file or any credentials to version control!

**📧 Rate Limits:** Default is 150 emails/hour to prevent Gmail account flags. Adjust in `.env` if needed.

**🔒 Privacy:** User credentials are never stored. Only temporary OAuth tokens are kept in session.