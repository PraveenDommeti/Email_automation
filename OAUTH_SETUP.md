# 🔐 Google OAuth 2.0 Setup Guide

This guide details how to configure the Google Cloud Console to allow users to log in with their Gmail accounts and send emails via the platform.

## 📋 Step 1: Create a Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **"New Project"**.
3. Name it (e.g., `Cold Email Automation`) and click **Create**.
4. Select the newly created project.

## ⚙️ Step 2: Enable Gmail API

1. In the sidebar, go to **APIs & Services** > **Library**.
2. Search for **"Gmail API"**.
3. Click on the result and then click **Enable**.

## 🛡️ Step 3: Configure OAuth Consent Screen

This screen is what users see when they log in to your app.

1. Go to **APIs & Services** > **OAuth consent screen**.
2. **User Type**:
   - Choose **External** (allows any Google account to sign in, but requires adding "Test Users" while in testing mode).
   - *Note: "Internal" is only for Google Workspace users within your own organization.*
3. Click **Create**.

### **App Information**
- **App Name**: `Email Automation System` (or your preferred name).
- **User Support Email**: Your email address.
- **Developer Contact Email**: Your email address.
- Click **Save and Continue**.

### **Scopes**
This defines what data "Email Automation System" allows the app to access.
1. Click **Add or Remove Scopes**.
2. In the filter, search for `gmail.send`.
3. Select the scope: `https://www.googleapis.com/auth/gmail.send` (Send messages only).
   - *Note: We only request permission to SEND emails, not read them, for better security/privacy.*
4. Click **Update**.
5. Click **Save and Continue**.

### **Test Users** (Crucial for "External" Testing)
Since your app is not verified by Google yet, you **MUST** add the specific email addresses that you intend to use for testing.
1. Click **+ Add Users**.
2. Enter your Gmail address (e.g., `praveendommeti333@gmail.com`).
3. Enter any other Gmail addresses you plan to test with.
4. Click **Add** -> **Save and Continue**.

## 🔑 Step 4: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application Type**: Select **Web application**.
4. **Name**: `Email Automation Client`.

### **Authorized JavaScript Origins**
This allows the frontend and backend to talk to Google.
- Add URI 1: `http://localhost:3000` (React Frontend)
- Add URI 2: `http://localhost:5000` (Flask Backend)

### **Authorized Redirect URIs**
This is where Google sends the user back after login. **This must match exactly.**
- Add URI: `http://localhost:5000/oauth2callback`

5. Click **Create**.

## 📝 Step 5: Save Credentials to Project

1. A popup will show your **Client ID** and **Client Secret**.
2. Open your project's `backend/.env` file.
3. Update the values:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_from_console
   GOOGLE_CLIENT_SECRET=your_client_secret_from_console
   ```
4. Ensure the redirect URI in `.env` matches what you set in the console:
   ```env
   GOOGLE_REDIRECT_URI=http://localhost:5000/oauth2callback
   ```

## ✅ Verification
Once configured:
1. Restart your backend (`python app.py`).
2. Go to the frontend (`http://localhost:3000`).
3. Click **Connect Gmail Account**.
4. You should see a Google screen asking to allow access to "Send email on your behalf".
5. Click **Continue** (if you see a "Google hasn't verified this app" warning, click **Advanced** > **Go to App (unsafe)** — this is normal for testing apps).

---
**Troubleshooting:**
- **Error 403: access_denied**: You forgot to add the email to "Test Users".
- **Error 400: redirect_uri_mismatch**: The URL in `backend/.env` does not *exactly* match the "Authorized redirect URI" in the console.
