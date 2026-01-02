# Fix: redirect_uri_mismatch Error

## The Problem
Google is rejecting the sign-in because the redirect URI doesn't match.

## The Solution

1. Go to: https://console.cloud.google.com/apis/credentials

2. Click on your OAuth 2.0 Client ID

3. Under "Authorized redirect URIs", make sure you have EXACTLY:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

4. Common mistakes:
   ❌ http://localhost:3000/api/auth/callback/google/ (extra slash)
   ❌ https://localhost:3000/api/auth/callback/google (https instead of http)
   ❌ http://127.0.0.1:3000/api/auth/callback/google (127.0.0.1 instead of localhost)
   ✅ http://localhost:3000/api/auth/callback/google (CORRECT)

5. Click "SAVE" at the bottom

6. Wait 1-2 minutes for changes to propagate

7. Try signing in again
