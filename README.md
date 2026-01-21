<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1quB_fFkvLCv00bKmQBbLqSPCnCeePVnW

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and configure your API keys:
   ```bash
   cp .env.example .env.local
   ```

3. Set up your API keys in [.env.local](.env.local):
   - **Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Firebase Config**: Get from [Firebase Console](https://console.firebase.google.com) → Project Settings → General → Your apps

4. Run the app:
   ```bash
   npm run dev
   ```

## Environment Variables

The following environment variables are required:

### Gemini AI
- `GEMINI_API_KEY` - Your Gemini API key for AI features
- `VITE_GEMINI_API_KEY` - Same key, exposed to the client

### Firebase
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID (optional)
