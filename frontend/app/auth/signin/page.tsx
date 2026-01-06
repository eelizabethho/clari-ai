"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn("google", { 
        callbackUrl,
        redirect: false 
      });
      
      if (result?.error) {
        setError("Failed to sign in. Please try again.");
      } else if (result?.ok) {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Sign in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50 pt-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-center mb-6 text-black">
          Sign in to Clari AI
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in with your Google account to access your interview transcripts and feedback.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className={`w-full px-6 py-3 rounded-md font-medium transition-all ${
            isLoading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-[#2271B1] text-white hover:bg-[#1a5a8a] cursor-pointer"
          } shadow-md hover:shadow-lg flex items-center justify-center gap-3`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50 pt-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <SignInForm />
    </Suspense>
  );
}

