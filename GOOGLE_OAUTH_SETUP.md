# Google OAuth Setup Guide

## Step 1: Sign in to Google Cloud Console (FREE)

1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account (any Gmail account works)
3. If this is your first time, you'll see a welcome screen - click "Get Started"

## Step 2: Create a Project (or use existing)

1. Click the project dropdown at the top (next to "Google Cloud")
2. Click "New Project"
3. Enter project name: `clari-ai` (or any name)
4. Click "Create"
5. Wait a few seconds, then select your new project from the dropdown

## Step 3: Enable Google+ API

1. Go to: **APIs & Services** > **Library** (in the left sidebar)
2. Search for: "Google+ API" or "People API"
3. Click on it and click **"Enable"**

## Step 4: Create OAuth Credentials

1. Go to: **APIs & Services** > **Credentials** (in the left sidebar)
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure OAuth consent screen first:
   - User Type: **External** (unless you have Google Workspace)
   - App name: **Clari AI**
   - User support email: **Your email**
   - Developer contact: **Your email**
   - Click **"Save and Continue"** through the steps
   - Click **"Back to Dashboard"**

5. Now create OAuth client ID:
   - Application type: **Web application**
   - Name: **Clari AI Web Client**
   - Authorized redirect URIs: Click **"+ ADD URI"** and add:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **"Create"**

6. **IMPORTANT**: A popup will show your credentials:
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc123xyz`)
   - **COPY THESE NOW** - you won't see the secret again!

## Step 5: Add to .env.local

1. In your project, go to: `frontend/.env.local` (create it if it doesn't exist)
2. Add these lines:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   ```

3. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as the value for NEXTAUTH_SECRET

## Step 6: Restart Your Server

```bash
cd frontend
npm run dev
```

## That's it! 🎉

Now when you click "Sign in with Google", it should redirect to Google's sign-in page.

---

**Note**: Google Cloud Console is FREE for development. You only pay if you exceed their free tier limits (which is very generous for OAuth).
