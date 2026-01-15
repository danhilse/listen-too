'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Spotify Icon Component
function SpotifyIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

// Check Icon
function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Copy Icon
function CopyIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

// External Link Icon
function ExternalLinkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get('playlistId');
  const playlistUrl = searchParams.get('playlistUrl');
  const trackCount = searchParams.get('trackCount');

  const [copied, setCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [embedKey, setEmbedKey] = useState(0);
  const [embedLoading, setEmbedLoading] = useState(true);

  // Cycling state
  const [bgImages, setBgImages] = useState<string[]>(['/bg/h full.webp']);
  const [bgIndex, setBgIndex] = useState(0);
  const [cyclingComplete, setCyclingComplete] = useState(false);
  const [showFirst, setShowFirst] = useState(true);

  // Fetch and randomize cycle images on mount
  useEffect(() => {
    fetch('/api/cycle-images')
      .then(res => res.json())
      .then((data: { images?: string[] }) => {
        if (data.images && data.images.length > 0) {
          const randomized = shuffleArray(data.images);
          // Don't end on a specific image - just cycle through all and stop randomly
          setBgImages(randomized);
        }
      })
      .catch(() => {
        // Keep default image if fetch fails
        setCyclingComplete(true);
      });
  }, []);

  // Preload upcoming images
  useEffect(() => {
    const preloadCount = 3;
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = bgIndex + i;
      if (nextIndex < bgImages.length) {
        const img = new window.Image();
        img.src = bgImages[nextIndex];
      }
    }
  }, [bgIndex, bgImages]);

  // Rapid image cycling - runs for ~2-3 seconds then stops
  useEffect(() => {
    if (bgImages.length > 1 && bgIndex < bgImages.length - 1) {
      const timer = setTimeout(() => {
        setShowFirst(prev => !prev);
        setBgIndex(bgIndex + 1);
      }, 120);
      return () => clearTimeout(timer);
    } else if (bgIndex === bgImages.length - 1) {
      setCyclingComplete(true);
    }
  }, [bgIndex, bgImages]);

  // Auto-copy to clipboard once cycling completes
  useEffect(() => {
    if (cyclingComplete && playlistUrl && !autoCopied) {
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
  }, [cyclingComplete, playlistUrl, autoCopied]);

  // Hide embed loading state after it has time to load
  useEffect(() => {
    if (cyclingComplete) {
      const timer = setTimeout(() => {
        setEmbedLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [cyclingComplete, embedKey]);

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

  // Error state - missing playlist info
  if (!playlistId || !playlistUrl) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0d1117]">
        {/* Background image */}
        <div className="absolute inset-y-0 left-[80%] sm:left-[65%] md:left-[50%] lg:left-[40%] right-[-30%]">
          <Image
            src="/bg/h full.webp"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#0d1117] to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0d1117]/60 to-transparent z-10" />
        </div>

        <div className="grain-overlay" />

        <div className="relative z-10 min-h-screen flex flex-col px-8 md:px-12 lg:px-16 xl:px-20 py-8">
          <header className="animate-fade-in">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight">listen too</span>
              <span className="text-[#1db954] text-2xl leading-none">*</span>
            </Link>
          </header>

          <main className="flex-1 flex flex-col justify-center max-w-xl py-12">
            <div className="animate-fade-slide-up">
              <span className="small-caps block mb-4">Error</span>
              <h1 className="editorial-headline text-3xl md:text-4xl mb-4">Something went wrong</h1>
              <p className="text-white/60 mb-8">Missing playlist information. Please try creating a new playlist.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-3 bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold px-6 py-3 rounded-full transition-all duration-300"
              >
                <span>Try again</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1117]">
      {/* Cycling background image */}
      <div className="absolute inset-y-0 left-[80%] sm:left-[65%] md:left-[50%] lg:left-[40%] right-[-30%]">
        {/* Two-layer crossfade system */}
        <div
          className={`absolute inset-0 transition-opacity duration-100 ${showFirst ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={bgImages[showFirst ? bgIndex : Math.max(0, bgIndex - 1)]}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-100 ${showFirst ? 'opacity-0' : 'opacity-100'}`}
        >
          <Image
            src={bgImages[showFirst ? Math.max(0, bgIndex - 1) : bgIndex]}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        </div>
        {/* Gradients */}
        <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#0d1117] to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0d1117]/60 to-transparent z-10" />
      </div>

      <div className="grain-overlay" />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col px-8 md:px-12 lg:px-16 xl:px-20 py-8">
        {/* Header */}
        <header className="animate-fade-in">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight">listen too</span>
            <span className="text-[#1db954] text-2xl leading-none">*</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center max-w-xl py-12">
          {/* Loading state - shown while cycling */}
          {!cyclingComplete && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-5 h-5 border-2 border-white/20 border-t-[#1db954] rounded-full animate-spin" />
                <span className="text-white/60">Creating your playlist...</span>
              </div>
              <h2 className="editorial-headline text-3xl md:text-4xl lg:text-5xl leading-[1.1] text-white/30">
                Curating your top tracks
              </h2>
            </div>
          )}

          {/* Success state - shown after cycling completes */}
          {cyclingComplete && (
            <>
              {/* Success Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 animate-fade-slide-up">
                  <div className="w-8 h-8 rounded-full bg-[#1db954] flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-black" />
                  </div>
                  <span className="small-caps">Playlist created</span>
                </div>

                <h1 className="editorial-headline text-3xl md:text-4xl lg:text-5xl leading-[1.1] mb-3 animate-fade-slide-up delay-100">
                  Your <em className="text-[#1db954]">{trackCount} tracks</em> are
                </h1>
                <h1 className="editorial-headline text-3xl md:text-4xl lg:text-5xl leading-[1.1] animate-fade-slide-up delay-200">
                  ready to share.
                </h1>

                {/* Auto-copied notification */}
                {autoCopied && (
                  <div className="mt-4 inline-flex items-center gap-2 text-[#1db954] text-sm animate-fade-in">
                    <CheckIcon className="w-4 h-4" />
                    <span>Link copied to clipboard</span>
                  </div>
                )}
              </div>

              {/* Spotify Embed */}
              <div className="mb-8 animate-fade-slide-up delay-300">
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#141414]">
                  {embedLoading && (
                    <div className="absolute inset-0 bg-[#141414] flex items-center justify-center z-10">
                      <div className="text-center">
                        <SpotifyIcon className="w-8 h-8 mx-auto mb-2 text-[#1db954] animate-pulse" />
                        <p className="text-white/30 text-sm">Loading preview...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    key={embedKey}
                    src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl"
                    onLoad={() => setEmbedLoading(false)}
                  />
                </div>
                <button
                  onClick={() => {
                    setEmbedLoading(true);
                    setEmbedKey((k) => k + 1);
                  }}
                  className="mt-2 text-white/30 hover:text-white/60 text-sm transition-colors duration-300"
                >
                  Embed not loading? Click to retry
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 animate-fade-slide-up delay-400">
                <button
                  onClick={handleCopy}
                  className="group bg-[#1db954] hover:bg-[#1ed760] text-black font-semibold px-5 py-3 rounded-full transition-all duration-300 flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-5 w-5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold px-5 py-3 rounded-full transition-all duration-300 flex items-center gap-2"
                >
                  <SpotifyIcon className="h-5 w-5" />
                  <span>Open in Spotify</span>
                  <ExternalLinkIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              {/* Create Another Link */}
              <div className="mt-10 animate-fade-slide-up delay-500">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-300"
                >
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  <span>Create another playlist</span>
                </Link>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="animate-fade-in delay-500">
          <div className="flex items-center gap-8 text-sm text-white/40">
            <span>Built with Spotify API</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-300"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-white/50">
            <div className="w-8 h-8 border-2 border-white/20 border-t-[#1db954] rounded-full animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
