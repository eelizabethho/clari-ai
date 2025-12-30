# Clari AI
![CI](https://github.com/<your-username>/<repo>/actions/workflows/main.yml/badge.svg)

An intelligent interview companion that helps you practice, reflect, and improve through real-time feedback.

## Project Structure

```
clari-ai/
├── frontend/          # Next.js frontend application
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── lib/           # Utilities and AWS clients
│   ├── services/      # Business logic services
│   └── public/        # Static assets
│
└── README.md          # This file
```

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the `frontend` directory with:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Dropzone** - File uploads
- **AWS SDK** - S3 integration

## Features

- 📤 Audio file upload to S3
- 🎨 Modern, responsive UI
- ⚡ Fast file processing
- 🔒 Secure AWS integration

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
