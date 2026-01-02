# Clari AI

Clari AI is a web app I built to help people get better at interviews by giving them real feedback on how they sound. You upload a practice interview recording, and it breaks down your performance using AI.

### What it Does

Clari AI lets users upload audio or video recordings of mock interviews. It transcribes the conversation, figures out who's speaking, and then gives feedback on things like clarity, confidence, and overall delivery.


## Main Features

-  **Google Login** – Sign in securely using Google
-  **File Uploads** – Drag and drop audio or video files
-  **Automatic Transcription** – Uses AWS Transcribe with speaker detection
-  **AI Feedback** – GPT analyzes the transcript and gives structured feedback
-  **Performance Dashboard** – See scores and insights in one place
-  **Speaker Labeling** – Separates interviewer vs. interviewee
-  **Async Processing** – Uploads process in the background so the app stays responsive

## Tech Stack

### Frontend
- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth** (Google OAuth)
- **React Dropzone**
- **Framer Motion**

### Backend / Infrastructure
- **Next.js API Routes**
- **AWS Lambda** for background processing
- **AWS S3** for file storage
- **AWS DynamoDB** for transcript history
- **AWS Transcribe** for speech-to-text
- **AWS CloudFormation** for infrastructure
- **OpenAI GPT-4o-mini** for feedback generation

### Dev Tools
- **AWS SDK v3**
- **Node.js 20**
- **Archiver** for packaging Lambda code

## How It Works

1. User uploads an interview recording
2. File is stored in S3 with user info
3. A Lambda function is triggered automatically
4. AWS Transcribe processes the audio
5. Transcript is saved and linked to the user
6. AI analyzes the transcript and generates feedback
7. Results show up in the dashboard

## Structure Overview

- **Frontend** – UI, auth, uploads, results
- **API layer** – Handles uploads and data flow
- **Lambda** – Background transcription logic
- **DynamoDB** – Stores transcript metadata
- **S3** – Stores raw audio and processed files
