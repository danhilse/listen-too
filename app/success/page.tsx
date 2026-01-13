'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('playlistId');
  const playlistUrl = searchParams.get('playlistUrl');
  const trackCount = searchParams.get('trackCount');

  const [copied, setCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [embedKey, setEmbedKey] = useState(0);
  const [embedLoading, setEmbedLoading] = useState(true);

  // Auto-copy to clipboard on mount
  useEffect(() => {
    if (playlistUrl && !autoCopied) {
      navigator.clipboard
        .writeText(playlistUrl)
        .then(() => {
          setAutoCopied(true);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        })
        .catch((err) => {
          console.error('Failed to auto-copy:', err);
        });
    }
  }, [playlistUrl, autoCopied]);

  // Hide loading state after embed has time to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setEmbedLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [embedKey]);

  const handleCopy = async () => {
    if (!playlistUrl) return;

    try {
      await navigator.clipboard.writeText(playlistUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!playlistId || !playlistUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-zinc-400 mb-8">Missing playlist information</p>
          <Link
            href="/"
            className="text-green-500 hover:text-green-400 underline"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">&#127881;</div>
        <h1 className="text-3xl font-bold mb-2">Your playlist is ready!</h1>
        <p className="text-zinc-400">
          {trackCount} tracks combined from your top songs and liked tracks
        </p>
        {autoCopied && (
          <p className="text-green-500 text-sm mt-2">
            Link copied to clipboard!
          </p>
        )}
      </div>

      {/* Spotify Embed */}
      <div className="w-full max-w-md mb-8 relative">
        {embedLoading && (
          <div className="absolute inset-0 bg-zinc-800 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <svg
                className="animate-spin h-8 w-8 mx-auto mb-3 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-zinc-400 text-sm">Loading playlist...</p>
            </div>
          </div>
        )}
        <iframe
          key={embedKey}
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="380"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
          onLoad={() => setEmbedLoading(false)}
        />
      </div>

      {/* Retry button if embed fails */}
      <button
        onClick={() => {
          setEmbedLoading(true);
          setEmbedKey((k) => k + 1);
        }}
        className="text-zinc-500 hover:text-zinc-300 text-sm mb-4 transition-colors"
      >
        Embed not loading? Click to retry
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopy}
        className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-3 rounded-full transition-colors flex items-center gap-2"
      >
        {copied ? (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Link
          </>
        )}
      </button>

      {/* Create Another */}
      <Link
        href="/"
        className="mt-6 text-zinc-400 hover:text-white transition-colors"
      >
        Create another playlist
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
