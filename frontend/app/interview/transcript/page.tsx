"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function TranscriptPage() {
  const searchParams = useSearchParams();
  const fileName = searchParams.get("fileName");
  
  const [transcript, setTranscript] = useState<string | null>(null);
  const [rawTranscript, setRawTranscript] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Send transcript for performance analysis
  const analyzeTranscript = async (transcriptText: string, file?: string | null) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText, fileName: file || fileName }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setShowAnalysis(true);
      } else {
        console.error('Analysis failed:', data.error);
      }
    } catch (err) {
      console.error('Error analyzing transcript:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Color coding for scores: green (8+), yellow (6-7), red (<6)
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Convert numeric score to readable label
  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    return 'Needs Improvement';
  };

  useEffect(() => {
    if (!fileName) {
      setError("No file name provided");
      setIsLoading(false);
      return;
    }

    // Poll for transcript since Lambda processes files asynchronously
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/transcript?fileName=${encodeURIComponent(fileName)}`);
        const data = await response.json();

        if (data.success && data.transcript) {
          setTranscript(data.transcript);
          setRawTranscript(data.rawTranscript || data.transcript);
          setSpeakers(data.speakers || 0);
          setIsLoading(false);
          clearInterval(pollInterval);
          
          // If analysis is already stored, use it; otherwise run new analysis
          if (data.analysis) {
            setAnalysis(data.analysis);
            setShowAnalysis(true);
          } else {
            // Use raw transcript (without speaker labels) for analysis
            const transcriptForAnalysis = data.rawTranscript || data.transcript;
            analyzeTranscript(transcriptForAnalysis, fileName);
          }
        } else if (data.ready === false) {
          // Still processing, keep polling
          setPollCount((prev) => prev + 1);
          if (pollCount > 60) {
            // Timeout after 3 minutes (60 * 3 seconds)
            setError("Transcript processing is taking longer than expected. Please try again later.");
            setIsLoading(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error("Error fetching transcript:", err);
        setPollCount((prev) => prev + 1);
        if (pollCount > 20) {
          setError("Failed to fetch transcript. Please try again.");
          setIsLoading(false);
          clearInterval(pollInterval);
        }
      }
    }, 3000);

    fetch(`/api/transcript?fileName=${encodeURIComponent(fileName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.transcript) {
          setTranscript(data.transcript);
          setRawTranscript(data.rawTranscript || data.transcript);
          setSpeakers(data.speakers || 0);
          setIsLoading(false);
          clearInterval(pollInterval);
          
          // If analysis is already stored, use it; otherwise run new analysis
          if (data.analysis) {
            setAnalysis(data.analysis);
            setShowAnalysis(true);
          } else {
            const transcriptForAnalysis = data.rawTranscript || data.transcript;
            analyzeTranscript(transcriptForAnalysis, fileName);
          }
        }
      })
      .catch((err) => {
        console.error("Error:", err);
      });

    return () => clearInterval(pollInterval);
  }, [fileName, pollCount]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-slate-50 py-8 pt-24">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-black">
            Interview Transcript
          </h1>
          <Link
            href="/interview"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back to Upload
          </Link>
        </div>

        {fileName && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">File:</span> {fileName}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Processing your interview...
            </p>
            <p className="text-sm text-gray-500">
              This may take a few minutes. Please wait...
            </p>
            {pollCount > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Checking for transcript... (attempt {pollCount})
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-md">
            <p className="text-red-800 font-medium">{error}</p>
            <Link
              href="/interview"
              className="text-sm text-red-600 hover:text-red-800 underline mt-2 inline-block"
            >
              Try uploading again
            </Link>
          </div>
        )}

        {transcript && !isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-300 rounded-md">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Transcript Ready
                </p>
                {speakers > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {speakers} speaker{speakers !== 1 ? 's' : ''} detected
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(transcript);
                  }}
                  className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded hover:bg-green-300"
                >
                  Copy Transcript
                </button>
                {!showAnalysis && (
                  <button
                    onClick={() => analyzeTranscript(rawTranscript || transcript, fileName)}
                    disabled={isAnalyzing}
                    className="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded hover:bg-blue-300 disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Performance'}
                  </button>
                )}
              </div>
            </div>

            {showAnalysis && analysis && (
              <div className="space-y-6">
                <div className="border-t-2 border-gray-200 pt-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Performance Dashboard
                  </h2>

                  {analysis.overall && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Overall Performance
                        </h3>
                        <div className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor(analysis.overall.score)}`}>
                          {analysis.overall.score}/10 - {getScoreLabel(analysis.overall.score)}
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2">{analysis.overall.summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {analysis.communication && (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">Communication</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(analysis.communication.score)}`}>
                            {analysis.communication.score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysis.communication.feedback}</p>
                      </div>
                    )}

                    {analysis.clarity && (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">Clarity & Articulation</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(analysis.clarity.score)}`}>
                            {analysis.clarity.score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysis.clarity.feedback}</p>
                      </div>
                    )}

                    {analysis.pace && (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">Pace & Pauses</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(analysis.pace.score)}`}>
                            {analysis.pace.score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysis.pace.feedback}</p>
                      </div>
                    )}

                    {analysis.confidence && (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">Confidence Level</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(analysis.confidence.score)}`}>
                            {analysis.confidence.score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysis.confidence.feedback}</p>
                      </div>
                    )}

                    {analysis.professionalism && (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">Professionalism</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(analysis.professionalism.score)}`}>
                            {analysis.professionalism.score}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{analysis.professionalism.feedback}</p>
                      </div>
                    )}
                  </div>

                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-3">Strengths</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-sm text-green-700">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.improvements && analysis.improvements.length > 0 && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-3">Areas for Improvement</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.improvements.map((improvement: string, idx: number) => (
                          <li key={idx} className="text-sm text-yellow-700">{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-3">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm text-blue-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-blue-700">Analyzing your performance...</p>
              </div>
            )}

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Transcript
                {speakers > 1 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({speakers} speakers detected)
                  </span>
                )}
              </h2>
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed space-y-3">
                  {transcript.split('\n\n').map((paragraph: string, idx: number) => {
                    // Check if this paragraph has a speaker label
                    const speakerMatch = paragraph.match(/^(Speaker \d+):\s*(.*)$/);
                    if (speakerMatch) {
                      const [, speakerLabel, content] = speakerMatch;
                      const speakerNum = speakerLabel.replace('Speaker ', '');
                      // Alternate colors for different speakers
                      const isEven = parseInt(speakerNum) % 2 === 0;
                      
                      return (
                        <div key={idx} className={`p-3 rounded-lg ${isEven ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-purple-50 border-l-4 border-purple-400'}`}>
                          <span className="font-semibold text-gray-800">{speakerLabel}</span>
                          <span className="text-gray-700 ml-2">{content}</span>
                        </div>
                      );
                    }
                    // Regular paragraph without speaker label
                    return (
                      <p key={idx} className="text-gray-700">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/interview"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Upload Another
              </Link>
              <button
                onClick={() => {
                  const blob = new Blob([transcript], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${fileName}-transcript.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-[#2271B1] text-white rounded-md hover:bg-[#1a5a8a] transition-colors"
              >
                Download Transcript
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

