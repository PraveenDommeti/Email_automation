# Email Automation System - AI-Powered Upgrade Implementation Plan

## 📋 Executive Summary

This plan outlines the upgrade of the existing Flask-based email automation system to include:
- **React.js frontend** for modern, responsive UI
- **Gemini AI integration** for personalized email generation
- **Gmail OAuth 2.0** for secure email sending (replacing SMTP)
- **Enhanced UX** with real-time progress tracking and AI content preview

---

## 🏗️ Architecture Overview

### Current Architecture
```
Flask Backend (app.py)
├── SMTP Email Sending (mail.py)
├── Email Verification (verify.py)
├── File Upload Handling
├── Progress Tracking (threading)
└── HTML/CSS/JS Frontend (templates/static)
```

### New Architecture
```
React Frontend (Port 3000)
├── File Upload Components
├── AI Email Generator UI
├── Gmail OAuth Integration
├── Real-time Progress Dashboard
└── Email Preview & Editing

Flask Backend API (Port 5000)
├── Gemini AI Integration (/generate_email_ai)
├── Gmail API Service (OAuth 2.0)
├── File Upload Endpoints
├── Progress Tracking API
└── Campaign Management
```

---

## 📁 Project Structure

```
Cold_email/
├── backend/
│   ├── app.py                    # Main Flask application
│   ├── config.py                 # Configuration management
│   ├── services/
│   │   ├── gemini_service.py     # Gemini AI integration
│   │   ├── gmail_service.py      # Gmail API service
│   │   └── file_service.py       # File handling utilities
│   ├── routes/
│   │   ├── email_routes.py       # Email sending endpoints
│   │   ├── ai_routes.py          # AI generation endpoints
│   │   └── auth_routes.py        # OAuth endpoints
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── AIEmailGenerator.jsx
│   │   │   ├── GmailAuth.jsx
│   │   │   ├── EmailPreview.jsx
│   │   │   ├── ProgressTracker.jsx
│   │   │   └── LogsTable.jsx
│   │   ├── services/
│   │   │   └── api.js            # API client
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── vite.config.js
│
└── uploads/                       # File storage
```

---

## 🔧 Implementation Steps

### Phase 1: Backend Setup & Gemini AI Integration

#### 1.1 Install New Dependencies
```bash
pip install google-generativeai google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client flask-cors python-dotenv
```

**New requirements.txt:**
```
Flask==3.0.0
Flask-CORS==4.0.0
PyPDF2==3.0.1
pandas==2.1.4
dnspython==2.4.2
validate-email-address==1.0.0
Werkzeug==3.0.1
google-generativeai==0.3.2
google-auth==2.25.2
google-auth-oauthlib==1.2.0
google-auth-httplib2==0.2.0
google-api-python-client==2.110.0
python-dotenv==1.0.0
PyPDF2==3.0.1
```

#### 1.2 Create Environment Configuration
**File: `.env`**
```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Gmail OAuth 2.0
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/oauth2callback

# Flask
FLASK_SECRET_KEY=your_secret_key_here
FLASK_ENV=development
```

#### 1.3 Create Gemini AI Service
**File: `backend/services/gemini_service.py`**
```python
import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2

load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

class GeminiEmailGenerator:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_email(self, recipient_name, company, job_role=None, resume_text=None):
        """Generate personalized email using Gemini AI"""
        
        prompt = f"""
        Generate a professional, personalized cold email for a job application with the following details:
        
        Recipient: {recipient_name}
        Company: {company}
        Job Role: {job_role or 'Any suitable position'}
        
        {f'Candidate Background (from resume): {resume_text[:1000]}' if resume_text else ''}
        
        Requirements:
        1. Professional and respectful tone
        2. Concise (150-200 words)
        3. Highlight relevant skills and experience
        4. Express genuine interest in the company
        5. Include a clear call-to-action
        6. Personalized to the recipient and company
        
        Return ONLY the email body text, no subject line.
        """
        
        response = self.model.generate_content(prompt)
        return response.text
    
    def generate_subject(self, recipient_name, company, job_role=None):
        """Generate email subject line"""
        
        prompt = f"""
        Generate a professional email subject line for a job application to {company}.
        Job role: {job_role or 'Internship/Entry-level opportunity'}
        
        Make it:
        - Professional and attention-grabbing
        - Specific to the company
        - Under 60 characters
        - No quotes or special formatting
        
        Return ONLY the subject line text.
        """
        
        response = self.model.generate_content(prompt)
        return response.text.strip()
    
    def extract_resume_text(self, pdf_path):
        """Extract text from resume PDF"""
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ''
                for page in reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            print(f"Error extracting resume text: {e}")
            return None
```

#### 1.4 Create Gmail API Service
**File: `backend/services/gmail_service.py`**
```python
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64
import os
from dotenv import load_dotenv

load_dotenv()

class GmailService:
    SCOPES = ['https://www.googleapis.com/auth/gmail.send']
    
    def __init__(self):
        self.client_config = {
            "web": {
                "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                "redirect_uris": [os.getenv('GOOGLE_REDIRECT_URI')],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
    
    def get_authorization_url(self):
        """Generate OAuth authorization URL"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES,
            redirect_uri=os.getenv('GOOGLE_REDIRECT_URI')
        )
        
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return auth_url, state
    
    def get_credentials_from_code(self, code, state):
        """Exchange authorization code for credentials"""
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES,
            redirect_uri=os.getenv('GOOGLE_REDIRECT_URI'),
            state=state
        )
        
        flow.fetch_token(code=code)
        return flow.credentials
    
    def send_email(self, credentials_dict, to_email, subject, body, resume_path=None):
        """Send email using Gmail API"""
        try:
            credentials = Credentials(**credentials_dict)
            service = build('gmail', 'v1', credentials=credentials)
            
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            
            message.attach(MIMEText(body, 'plain'))
            
            # Attach resume if provided
            if resume_path and os.path.exists(resume_path):
                with open(resume_path, 'rb') as f:
                    part = MIMEBase('application', 'pdf')
                    part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename={os.path.basename(resume_path)}'
                    )
                    message.attach(part)
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            send_message = {'raw': raw_message}
            
            service.users().messages().send(userId='me', body=send_message).execute()
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
```

#### 1.5 Create API Routes
**File: `backend/routes/ai_routes.py`**
```python
from flask import Blueprint, request, jsonify, session
from services.gemini_service import GeminiEmailGenerator

ai_bp = Blueprint('ai', __name__)
gemini_service = GeminiEmailGenerator()

@ai_bp.route('/generate_email_ai', methods=['POST'])
def generate_email_ai():
    """Generate AI-powered email content"""
    try:
        data = request.json
        recipient_name = data.get('recipient_name', 'Hiring Manager')
        company = data.get('company', '')
        job_role = data.get('job_role')
        resume_file = data.get('resume_file')
        
        # Extract resume text if provided
        resume_text = None
        if resume_file:
            resume_text = gemini_service.extract_resume_text(resume_file)
        
        # Generate email content
        subject = gemini_service.generate_subject(recipient_name, company, job_role)
        body = gemini_service.generate_email(recipient_name, company, job_role, resume_text)
        
        return jsonify({
            'success': True,
            'subject': subject,
            'body': body
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

**File: `backend/routes/auth_routes.py`**
```python
from flask import Blueprint, request, jsonify, session, redirect
from services.gmail_service import GmailService

auth_bp = Blueprint('auth', __name__)
gmail_service = GmailService()

@auth_bp.route('/gmail/authorize', methods=['GET'])
def gmail_authorize():
    """Initiate Gmail OAuth flow"""
    auth_url, state = gmail_service.get_authorization_url()
    session['oauth_state'] = state
    return jsonify({'auth_url': auth_url})

@auth_bp.route('/oauth2callback', methods=['GET'])
def oauth2callback():
    """Handle OAuth callback"""
    code = request.args.get('code')
    state = request.args.get('state')
    
    if state != session.get('oauth_state'):
        return jsonify({'error': 'Invalid state parameter'}), 400
    
    credentials = gmail_service.get_credentials_from_code(code, state)
    
    # Store credentials in session (temporary)
    session['gmail_credentials'] = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    return redirect('http://localhost:3000?auth=success')

@auth_bp.route('/gmail/status', methods=['GET'])
def gmail_status():
    """Check if Gmail is authenticated"""
    authenticated = 'gmail_credentials' in session
    return jsonify({'authenticated': authenticated})
```

#### 1.6 Update Main Flask App
**File: `backend/app.py`** (Updated)
```python
from flask import Flask, session
from flask_cors import CORS
from dotenv import load_dotenv
import os
from routes.ai_routes import ai_bp
from routes.auth_routes import auth_bp
# ... existing imports

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')

# Enable CORS for React frontend
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

# Register blueprints
app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# ... rest of existing code
```

---

### Phase 2: React Frontend Development

#### 2.1 Initialize React Project
```bash
cd d:\Email_Automation\Cold_email
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-icons
```

#### 2.2 Create API Service
**File: `frontend/src/services/api.js`**
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const generateAIEmail = async (data) => {
  const response = await api.post('/api/ai/generate_email_ai', data);
  return response.data;
};

export const getGmailAuthUrl = async () => {
  const response = await api.get('/api/auth/gmail/authorize');
  return response.data;
};

export const checkGmailStatus = async () => {
  const response = await api.get('/api/auth/gmail/status');
  return response.data;
};

export const sendEmails = async (config) => {
  const response = await api.post('/send_emails', config);
  return response.data;
};

export const getProgress = async () => {
  const response = await api.get('/progress');
  return response.data;
};

export const cancelEmails = async () => {
  const response = await api.post('/cancel_emails');
  return response.data;
};

export default api;
```

#### 2.3 Create React Components

**File: `frontend/src/components/FileUpload.jsx`**
```jsx
import React, { useState } from 'react';
import { FaCloudUploadAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { uploadFile } from '../services/api';

const FileUpload = ({ label, accept, onUploadSuccess, id }) => {
  const [fileName, setFileName] = useState('No file selected');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    setFileName('Uploading...');

    try {
      const result = await uploadFile(file);
      setFileName(result.filename);
      setStatus('success');
      onUploadSuccess(result.path);
    } catch (error) {
      setFileName('Upload failed');
      setStatus('error');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <label>{label}</label>
      <div className="file-upload">
        <input
          type="file"
          id={id}
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
        />
        <label htmlFor={id} className="file-label">
          <FaCloudUploadAlt /> Choose File
        </label>
        <span className={`file-name status-${status}`}>
          {status === 'success' && <FaCheckCircle />}
          {status === 'error' && <FaTimesCircle />}
          {fileName}
        </span>
      </div>
    </div>
  );
};

export default FileUpload;
```

**File: `frontend/src/components/AIEmailGenerator.jsx`**
```jsx
import React, { useState } from 'react';
import { FaMagic, FaSpinner } from 'react-icons/fa';
import { generateAIEmail } from '../services/api';

const AIEmailGenerator = ({ resumePath, onEmailGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: 'Hiring Manager',
    company: '',
    job_role: '',
  });

  const handleGenerate = async () => {
    if (!formData.company) {
      alert('Please enter a company name');
      return;
    }

    setLoading(true);
    try {
      const result = await generateAIEmail({
        ...formData,
        resume_file: resumePath,
      });
      
      onEmailGenerated({
        subject: result.subject,
        body: result.body,
      });
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to generate email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2><FaMagic /> AI Email Generator</h2>
      <div className="form-group">
        <label>Recipient Name:</label>
        <input
          type="text"
          value={formData.recipient_name}
          onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
          placeholder="e.g., Hiring Manager, John Doe"
        />
      </div>
      <div className="form-group">
        <label>Company Name:</label>
        <input
          type="text"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="e.g., Google, Microsoft"
          required
        />
      </div>
      <div className="form-group">
        <label>Job Role (Optional):</label>
        <input
          type="text"
          value={formData.job_role}
          onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
          placeholder="e.g., Software Engineer, Data Analyst"
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={loading || !resumePath}
      >
        {loading ? (
          <><FaSpinner className="spin" /> Generating...</>
        ) : (
          <><FaMagic /> Generate AI Email</>
        )}
      </button>
      {!resumePath && (
        <small style={{ color: '#ef4444', marginTop: '10px', display: 'block' }}>
          Please upload your resume first
        </small>
      )}
    </div>
  );
};

export default AIEmailGenerator;
```

**File: `frontend/src/components/GmailAuth.jsx`**
```jsx
import React, { useState, useEffect } from 'react';
import { FaGoogle, FaCheckCircle } from 'react-icons/fa';
import { getGmailAuthUrl, checkGmailStatus } from '../services/api';

const GmailAuth = ({ onAuthSuccess }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Check for auth success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setAuthenticated(true);
      onAuthSuccess();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const result = await checkGmailStatus();
      setAuthenticated(result.authenticated);
      if (result.authenticated) {
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const result = await getGmailAuthUrl();
      window.location.href = result.auth_url;
    } catch (error) {
      console.error('Auth error:', error);
      alert('Failed to initiate Gmail authentication');
    }
  };

  if (loading) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="card">
      <h2><FaGoogle /> Gmail Connection</h2>
      {authenticated ? (
        <div className="auth-success">
          <FaCheckCircle style={{ color: '#10b981', fontSize: '48px' }} />
          <p>Gmail account connected successfully!</p>
          <small>Emails will be sent from your connected Gmail account</small>
        </div>
      ) : (
        <div>
          <p>Connect your Gmail account to send emails securely using OAuth 2.0</p>
          <button className="btn btn-primary" onClick={handleConnect}>
            <FaGoogle /> Connect Gmail Account
          </button>
          <small style={{ display: 'block', marginTop: '10px' }}>
            Your credentials are never stored. We only use temporary access tokens.
          </small>
        </div>
      )}
    </div>
  );
};

export default GmailAuth;
```

**File: `frontend/src/components/EmailPreview.jsx`**
```jsx
import React from 'react';
import { FaEye, FaEdit } from 'react-icons/fa';

const EmailPreview = ({ subject, body, onEdit }) => {
  return (
    <div className="card">
      <h2><FaEye /> Email Preview</h2>
      <div className="email-preview">
        <div className="preview-header">
          <strong>Subject:</strong>
          <input
            type="text"
            value={subject}
            onChange={(e) => onEdit({ subject: e.target.value, body })}
            className="subject-input"
          />
        </div>
        <div className="preview-body">
          <textarea
            value={body}
            onChange={(e) => onEdit({ subject, body: e.target.value })}
            rows={15}
            className="body-textarea"
          />
        </div>
        <small><FaEdit /> You can edit the AI-generated content above</small>
      </div>
    </div>
  );
};

export default EmailPreview;
```

**File: `frontend/src/components/ProgressTracker.jsx`**
```jsx
import React, { useEffect, useState } from 'react';
import { FaChartLine, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getProgress } from '../services/api';

const ProgressTracker = ({ isActive, onComplete }) => {
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    sent: 0,
    failed: 0,
    status: 'idle',
  });

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(async () => {
        try {
          const data = await getProgress();
          setProgress(data);
          
          if (['completed', 'error', 'cancelled'].includes(data.status)) {
            clearInterval(interval);
            onComplete(data);
          }
        } catch (error) {
          console.error('Progress update error:', error);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive]);

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="card">
      <h2><FaChartLine /> Sending Progress</h2>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="progress-stats">
        <span>{progress.current} / {progress.total} emails processed</span>
        <div className="stats">
          <span className="success">
            <FaCheckCircle /> {progress.sent} Sent
          </span>
          <span className="error">
            <FaTimesCircle /> {progress.failed} Failed
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
```

---

### Phase 3: Integration & Testing

#### 3.1 Update Backend to Use Gmail API
Modify the email sending logic in `app.py` to use Gmail API instead of SMTP when credentials are available.

#### 3.2 Testing Checklist
- [ ] File upload functionality
- [ ] Gemini AI email generation
- [ ] Gmail OAuth flow
- [ ] Email sending with Gmail API
- [ ] Progress tracking
- [ ] Error handling
- [ ] Rate limiting (100-200 emails/hour)
- [ ] Responsive design (mobile/desktop)

---

## 🔐 Security Considerations

1. **Never store passwords** - Use OAuth tokens only
2. **Session-based token storage** - Tokens expire with session
3. **HTTPS in production** - Encrypt all communications
4. **Environment variables** - Keep API keys secure
5. **Rate limiting** - Prevent Gmail account flags
6. **Input validation** - Sanitize all user inputs
7. **CORS configuration** - Restrict to known origins

---

## 📊 Rate Limiting Strategy

```python
# Implement in backend
from time import sleep
import random

def send_emails_with_rate_limit(emails, credentials, max_per_hour=150):
    delay = 3600 / max_per_hour  # seconds between emails
    
    for email in emails:
        send_email(credentials, email)
        sleep(delay + random.uniform(0, 2))  # Add jitter
```

---

## 🚀 Deployment Steps

### Development
```bash
# Terminal 1 - Backend
cd d:\Email_Automation\Cold_email
python app.py

# Terminal 2 - Frontend
cd d:\Email_Automation\Cold_email\frontend
npm run dev
```

### Production Considerations
- Use production WSGI server (Gunicorn)
- Enable HTTPS
- Use production React build
- Set up proper domain for OAuth redirect
- Use production database for campaign history
- Implement proper logging

---

## 📝 Environment Setup Guide

### 1. Get Gemini API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Add to `.env` file

### 2. Set Up Gmail OAuth
1. Go to Google Cloud Console
2. Create new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/oauth2callback`
6. Download credentials and add to `.env`

### 3. Configure Flask Secret
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Add output to `.env` as `FLASK_SECRET_KEY`

---

## 🎯 Success Metrics

- ✅ AI-generated emails feel personalized and professional
- ✅ OAuth flow completes without errors
- ✅ Emails send successfully via Gmail API
- ✅ Progress tracking updates in real-time
- ✅ UI is responsive on mobile and desktop
- ✅ No Gmail account flags or blocks
- ✅ Error handling provides clear user feedback

---

## 🔄 Migration from Current System

1. **Backup existing data** - Save `sent_emails.txt` and uploads
2. **Test in parallel** - Keep old system running during testing
3. **Gradual rollout** - Start with test emails
4. **Monitor performance** - Track success rates
5. **User feedback** - Gather feedback and iterate

---

## 📚 Additional Features (Optional)

- Campaign history dashboard (Firestore)
- Email templates library
- A/B testing for subject lines
- Analytics dashboard
- Scheduled sending
- Email warm-up feature
- Blacklist management
- Bounce handling

---

## 🛠️ Troubleshooting

### Common Issues

**Gemini API errors:**
- Check API key validity
- Verify quota limits
- Review prompt formatting

**OAuth failures:**
- Verify redirect URI matches exactly
- Check client ID/secret
- Ensure Gmail API is enabled

**Email sending fails:**
- Check rate limits
- Verify credentials
- Review Gmail API quotas

---

This implementation plan provides a complete blueprint for upgrading your email automation system. Would you like me to start implementing any specific phase?
