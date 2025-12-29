# Testing & Verification Guide

## 🧪 Testing Strategy

This guide helps you verify that all components are working correctly.

## 📋 Pre-Flight Checklist

### 1. Environment Setup
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Gemini API key obtained
- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] OAuth credentials created
- [ ] `.env` file configured

### 2. Dependencies Installed
- [ ] Backend: `pip install -r requirements.txt`
- [ ] Frontend: `npm install`

## 🔍 Component Testing

### Backend Tests

#### Test 1: Backend Server Starts
```bash
cd backend
python app.py
```

**Expected Output:**
```
🚀 Email Automation System - AI Powered
📁 Upload folder: uploads
🤖 Gemini AI: ✅ Configured
📧 Gmail OAuth: ✅ Configured
Starting server on http://localhost:5000
```

**Troubleshooting:**
- If Gemini shows ❌: Check `GEMINI_API_KEY` in `.env`
- If Gmail shows ❌: Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- If server won't start: Check port 5000 is not in use

#### Test 2: Health Check Endpoint
Open browser or use curl:
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": {
    "gemini_ai": true,
    "gmail_oauth": true,
    "gmail_authenticated": false
  }
}
```

#### Test 3: File Upload
```bash
# Create a test file
echo "Test content" > test.txt

# Upload using curl
curl -X POST -F "file=@test.txt" http://localhost:5000/upload
```

**Expected Response:**
```json
{
  "success": true,
  "filename": "test_<timestamp>.txt",
  "path": "uploads/test_<timestamp>.txt",
  "size_mb": 0.0
}
```

### Frontend Tests

#### Test 1: Frontend Server Starts
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

#### Test 2: UI Loads
1. Open browser: `http://localhost:3000`
2. You should see:
   - Header with "Email Automation System"
   - Four tabs: Setup, AI Generator, Preview & Send, Progress
   - Dark theme with purple gradient header

#### Test 3: Tab Navigation
1. Click each tab
2. Verify content changes
3. Check for smooth animations

### Integration Tests

#### Test 1: Gmail OAuth Flow
1. Go to Setup tab
2. Click "Connect Gmail Account"
3. You should be redirected to Google login
4. After authorization, redirected back with success message
5. Status should show "Gmail Connected Successfully!"

**Troubleshooting:**
- If redirect fails: Check `GOOGLE_REDIRECT_URI` matches exactly
- If authorization fails: Verify OAuth credentials
- If stuck on redirect: Check browser console for errors

#### Test 2: File Upload Flow
1. Go to Setup tab
2. Click "Choose File" for Resume
3. Select a PDF file
4. Should show: ✅ filename.pdf
5. Repeat for Email List (CSV)

**Troubleshooting:**
- If upload fails: Check backend is running
- If file not accepted: Verify file extension (.pdf or .csv)
- If error shown: Check backend logs

#### Test 3: AI Email Generation
1. Ensure resume is uploaded
2. Go to AI Generator tab
3. Enter:
   - Company: "Google"
   - Recipient Name: "Hiring Manager"
   - Job Role: "Software Engineer"
4. Click "Generate Personalized Email"
5. Wait 3-5 seconds
6. Should show success message
7. Go to Preview & Send tab
8. Should see AI-generated subject and body

**Expected Behavior:**
- Subject: Professional, company-specific
- Body: Personalized, 150-200 words, mentions company

**Troubleshooting:**
- If generation fails: Check Gemini API key
- If slow: Normal, AI takes 3-5 seconds
- If generic content: AI fallback activated (check API quota)

#### Test 4: Email Preview & Edit
1. Go to Preview & Send tab
2. Subject should be editable
3. Body should be editable (textarea)
4. Changes should persist

#### Test 5: Email Campaign (Full Flow)
**Prerequisites:**
- Gmail connected
- Resume uploaded
- Email list uploaded (use test CSV with your own email)
- Email content ready

**Test CSV** (`test_campaign.csv`):
```csv
SNo,Name,Email,Company
1,Test User,your-email@gmail.com,TestCorp
```

**Steps:**
1. Upload test CSV with YOUR email
2. Go to Preview & Send
3. Click "Start Email Campaign"
4. Should redirect to Progress tab
5. Watch progress bar fill
6. Check logs for "✅ Email sent to..."
7. Check your email inbox
8. Should receive the email with resume attached

**Expected Timeline:**
- Campaign starts: Immediate
- Progress updates: Every 1 second
- Email sent: Within 5-10 seconds
- Completion: Shows "✨ Campaign completed"

**Troubleshooting:**
- If campaign won't start: Check all prerequisites
- If no progress: Check backend logs
- If email not received: Check spam folder
- If failed: Check logs for error details

## 🎯 Manual Test Scenarios

### Scenario 1: New User Onboarding
1. Fresh start (no auth)
2. Connect Gmail
3. Upload files
4. Generate AI email
5. Send test campaign
6. Verify success

**Time Required:** 5-10 minutes

### Scenario 2: Bulk Campaign
1. Prepare CSV with 10 test emails
2. Upload resume and CSV
3. Generate AI email
4. Review and edit
5. Start campaign
6. Monitor progress
7. Verify all sent

**Time Required:** 10-15 minutes

### Scenario 3: Error Handling
1. Try uploading invalid file (e.g., .txt as resume)
2. Try starting campaign without Gmail auth
3. Try AI generation without resume
4. Cancel campaign mid-way
5. Verify error messages are clear

## 📊 Performance Benchmarks

### Expected Performance
- **File Upload**: < 2 seconds for 5MB file
- **AI Generation**: 3-5 seconds per email
- **Email Sending**: 2-3 seconds per email
- **Progress Updates**: 1 second interval
- **UI Response**: < 100ms for interactions

### Load Testing
For 50 emails:
- **Total Time**: ~3-4 minutes (with rate limiting)
- **Success Rate**: > 95%
- **Memory Usage**: < 200MB (backend)

## 🐛 Common Issues & Solutions

### Issue: "GEMINI_API_KEY not found"
**Solution:** 
```bash
cd backend
# Edit .env file
nano .env  # or notepad .env on Windows
# Add: GEMINI_API_KEY=your_key_here
```

### Issue: "OAuth redirect failed"
**Solution:**
1. Check Google Cloud Console
2. Verify redirect URI: `http://localhost:5000/oauth2callback`
3. Use exact URL (not 127.0.0.1)

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Issue: Frontend can't connect to backend
**Solution:**
1. Verify backend is running on port 5000
2. Check browser console for CORS errors
3. Verify proxy settings in `vite.config.js`

### Issue: AI generates generic content
**Solution:**
- Check Gemini API quota
- Verify API key is valid
- System will use fallback template if API fails

### Issue: Emails going to spam
**Solution:**
- Use professional email content
- Don't send too many at once
- Personalize each email
- Warm up Gmail account gradually

## ✅ Acceptance Criteria

System is ready for production when:

- [x] Backend starts without errors
- [x] Frontend loads correctly
- [x] Gmail OAuth completes successfully
- [x] Files upload without issues
- [x] AI generates personalized content
- [x] Email preview works
- [x] Test email sends successfully
- [x] Campaign completes with logs
- [x] Progress tracking updates in real-time
- [x] No console errors
- [x] Responsive on mobile

## 📝 Test Report Template

```markdown
# Test Report - [Date]

## Environment
- Python Version: 
- Node Version: 
- OS: 

## Test Results

### Backend
- [ ] Server starts
- [ ] Health check passes
- [ ] File upload works
- [ ] Gemini AI configured
- [ ] Gmail OAuth configured

### Frontend
- [ ] UI loads
- [ ] Tabs work
- [ ] File uploads work
- [ ] Gmail auth works
- [ ] AI generation works
- [ ] Email preview works
- [ ] Campaign runs successfully

### Issues Found
1. 
2. 
3. 

### Notes
- 
```

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Create .env backup** (without committing)
2. **Document any custom configurations**
3. **Set up monitoring** (optional)
4. **Prepare email templates**
5. **Build email list**
6. **Start with small campaigns** (10-20 emails)
7. **Scale gradually**

## 📞 Support

If you encounter issues:
1. Check this testing guide
2. Review `GETTING_STARTED.md`
3. Check backend/frontend README files
4. Review `IMPLEMENTATION_PLAN.md`
5. Check browser console and backend logs

---

**Remember:** Start small, test thoroughly, and scale gradually!
