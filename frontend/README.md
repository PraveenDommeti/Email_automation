# Frontend Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📦 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx         # File upload component
│   │   ├── AIEmailGenerator.jsx   # AI email generation
│   │   ├── GmailAuth.jsx          # Gmail OAuth
│   │   ├── EmailPreview.jsx       # Email preview & editing
│   │   ├── ProgressTracker.jsx    # Campaign progress
│   │   └── LogsTable.jsx          # Campaign logs
│   ├── services/
│   │   └── api.js                 # API client
│   ├── App.jsx                    # Main app component
│   ├── App.css                    # App styles
│   ├── index.css                  # Global styles
│   └── main.jsx                   # Entry point
├── index.html                     # HTML template
├── package.json                   # Dependencies
└── vite.config.js                 # Vite configuration

## 🎨 Features

- ✨ Modern dark theme UI
- 🎯 Tab-based navigation
- 📤 Drag-and-drop file uploads
- 🤖 AI email generation with Gemini
- 🔐 Secure Gmail OAuth 2.0
- 📊 Real-time progress tracking
- 📝 Live campaign logs
- 📱 Fully responsive design

## 🔧 Configuration

The frontend is configured to proxy API requests to the backend running on `http://localhost:5000`.

See `vite.config.js` for proxy configuration.

## 🏗️ Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 Usage Flow

1. **Setup Tab**
   - Connect Gmail account via OAuth
   - Upload resume (PDF)
   - Upload email list (CSV)
   - Set maximum emails to send

2. **AI Generator Tab**
   - Enter recipient details
   - Generate personalized email with AI
   - Review AI-generated content

3. **Preview & Send Tab**
   - Review and edit email content
   - Start email campaign

4. **Progress Tab**
   - Monitor real-time progress
   - View campaign logs
   - Cancel campaign if needed

## 🔍 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 5000
- Check CORS configuration in backend
- Verify proxy settings in vite.config.js

### OAuth Redirect Issues
- Ensure redirect URI matches backend configuration
- Check that you're using http://localhost:3000 (not 127.0.0.1)

### Build Errors
- Delete `node_modules` and run `npm install` again
- Clear Vite cache: `rm -rf node_modules/.vite`
