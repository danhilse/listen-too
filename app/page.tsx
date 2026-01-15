'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TRACK_COUNT_OPTIONS } from './lib/constants';
import { TrackCount, TimePeriod } from './lib/types';
import Image from 'next/image';

// Static background image for landing page
const BG_IMAGE = '/bg/h full.webp';

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

// Arrow Icon for selects
function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [trackCount, setTrackCount] = useState<TrackCount>('10');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('short_term');
  const [isLoading, setIsLoading] = useState(false);

  // Cycling state (triggered on button click)
  const [bgImages, setBgImages] = useState<string[]>([]);
  const [isCycling, setIsCycling] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showFirst, setShowFirst] = useState(true);
  const redirectUrl = useRef<string>('');

  // Preload cycle images on mount (so they're ready when button is clicked)
  useEffect(() => {
    fetch('/api/cycle-images')
      .then(res => res.json())
      .then((data: { images?: string[] }) => {
        if (data.images && data.images.length > 0) {
          const randomized = shuffleArray(data.images);
          setBgImages(randomized);
          // Preload first batch
          randomized.slice(0, 8).forEach(src => {
            const img = new window.Image();
            img.src = src;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Image cycling effect (only runs when isCycling is true)
  useEffect(() => {
    if (!isCycling || bgImages.length === 0) return;

    const timer = setTimeout(() => {
      setShowFirst(prev => !prev);
      setBgIndex(prev => (prev + 1) % bgImages.length);
    }, 180); // Slower cycling speed

    return () => clearTimeout(timer);
  }, [isCycling, bgIndex, bgImages]);

  // Redirect after cycling starts
  useEffect(() => {
    if (isCycling && redirectUrl.current) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl.current;
      }, 1500); // Show cycling for 1.5s before redirect
      return () => clearTimeout(timer);
    }
  }, [isCycling]);

  const handleCreatePlaylist = () => {
    setIsLoading(true);
    redirectUrl.current = `/api/auth/login?trackCount=${trackCount}&timePeriod=${timePeriod}`;

    if (bgImages.length > 0) {
      setIsCycling(true);
    } else {
      // No images loaded, redirect immediately
      window.location.href = redirectUrl.current;
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth_denied':
        return 'Spotify authorization was cancelled. Please try again.';
      case 'creation_failed':
        return 'Failed to create playlist. Please try again.';
      case 'not_authenticated':
        return 'Session expired. Please try again.';
      case 'no_tracks':
        return 'No tracks found for the selected time period.';
      case 'config_error':
        return 'App configuration error. Please contact support.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1117]">
      {/* Background image - positioned to shift left edge off-screen */}
      <div className="absolute inset-y-0 left-[80%] sm:left-[65%] md:left-[50%] lg:left-[40%] right-[-30%]">
        {/* Static image (shown when not cycling) */}
        {!isCycling && (
          <Image
            src={BG_IMAGE}
            alt="Person enjoying music"
            fill
            className="object-cover object-center"
            priority
          />
        )}
        {/* Cycling images (shown when loading) */}
        {isCycling && bgImages.length > 0 && (
          <>
            <div
              className={`absolute inset-0 transition-opacity duration-150 ${showFirst ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={bgImages[showFirst ? bgIndex : (bgIndex - 1 + bgImages.length) % bgImages.length]}
                alt=""
                fill
                className="object-cover object-center"
                priority
              />
            </div>
            <div
              className={`absolute inset-0 transition-opacity duration-150 ${showFirst ? 'opacity-0' : 'opacity-100'}`}
            >
              <Image
                src={bgImages[showFirst ? (bgIndex - 1 + bgImages.length) % bgImages.length : bgIndex]}
                alt=""
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </>
        )}
        {/* Soft edge gradient to blend into background */}
        <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#0d1117] to-transparent z-10" />
        {/* Bottom gradient for depth */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0d1117]/60 to-transparent z-10" />
      </div>

      {/* Subtle grain overlay */}
      <div className="grain-overlay" />

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col px-8 md:px-12 lg:px-16 xl:px-20 py-8">
        {/* Header */}
        <header className="animate-fade-in">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              listen too
            </h1>
            <span className="text-[#1db954] text-2xl leading-none">*</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center max-w-2xl py-12">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-400 px-5 py-4 rounded-lg mb-10 text-sm animate-fade-in">
              {getErrorMessage(error)}
            </div>
          )}

          {/* Main Headline */}
          <div className="space-y-1 mb-10">
            <h2 className="editorial-headline text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] animate-fade-slide-up">
              Create a playlist of your
            </h2>
            <h2 className="editorial-headline text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] animate-fade-slide-up delay-100">
              most played songs,
            </h2>
            <h2 className="editorial-headline text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] animate-fade-slide-up delay-200">
              ready to share in seconds.
            </h2>
          </div>

          {/* Selection Controls */}
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-4 md:gap-3 mb-8 text-lg animate-fade-slide-up delay-300">
            <div className="flex items-center gap-3">
              <span className="text-white/70">I want to share my</span>

              {/* Track Count Select */}
              <div className="relative">
                <select
                  value={trackCount}
                  onChange={(e) => setTrackCount(e.target.value as TrackCount)}
                  disabled={isLoading}
                  className="appearance-none bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white px-4 py-2 pr-9 rounded-lg cursor-pointer text-base font-medium transition-colors focus:outline-none focus:border-[#1db954]"
                >
                  {TRACK_COUNT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#141414] text-white">
                      {option.label} most-played songs
                    </option>
                  ))}
                </select>
                <ChevronIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-white/70">in the last</span>

              {/* Time Period Select */}
              <div className="relative">
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                  disabled={isLoading}
                  className="appearance-none bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white px-4 py-2 pr-9 rounded-lg cursor-pointer text-base font-medium transition-colors focus:outline-none focus:border-[#1db954]"
                >
                  <option value="short_term" className="bg-[#141414] text-white">month</option>
                  <option value="medium_term" className="bg-[#141414] text-white">6 months</option>
                  <option value="long_term" className="bg-[#141414] text-white">year</option>
                </select>
                <ChevronIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="animate-fade-slide-up delay-400">
            <button
              onClick={handleCreatePlaylist}
              disabled={isLoading}
              className="group bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-full text-base transition-all duration-300 flex items-center gap-2.5"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <SpotifyIcon className="h-5 w-5" />
                  <span>Continue with Spotify</span>
                </>
              )}
            </button>
          </div>
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

export default function Home() {
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
      <HomeContent />
    </Suspense>
  );
}
