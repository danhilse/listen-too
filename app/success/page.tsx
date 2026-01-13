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
      <div className="w-full max-w-md mb-8">
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="380"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
        />
      </div>

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
