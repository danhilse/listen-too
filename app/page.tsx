'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TRACK_COUNT_OPTIONS, TIME_PERIOD_OPTIONS } from './lib/constants';
import { TrackCount, TimePeriod } from './lib/types';

function HomeContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [trackCount, setTrackCount] = useState<TrackCount>('10');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('short_term');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePlaylist = () => {
    setIsLoading(true);
    window.location.href = `/api/auth/login?trackCount=${trackCount}&timePeriod=${timePeriod}`;
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold mb-12 text-center">Listen Too</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-8 max-w-md text-center">
          {getErrorMessage(error)}
        </div>
      )}

      <div className="text-xl md:text-2xl flex flex-wrap items-center justify-center gap-2 mb-12 text-center leading-relaxed">
        <span className="text-zinc-300">I want to share my top</span>
        <select
          value={trackCount}
          onChange={(e) => setTrackCount(e.target.value as TrackCount)}
          disabled={isLoading}
          className="bg-transparent border-b-2 border-green-500 text-green-500 font-bold text-xl md:text-2xl px-2 py-1 cursor-pointer focus:outline-none appearance-none text-center"
          style={{ minWidth: '60px' }}
        >
          {TRACK_COUNT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-zinc-900">
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-zinc-300">tracks from the last</span>
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          disabled={isLoading}
          className="bg-transparent border-b-2 border-green-500 text-green-500 font-bold text-xl md:text-2xl px-2 py-1 cursor-pointer focus:outline-none appearance-none text-center"
          style={{ minWidth: '120px' }}
        >
          {TIME_PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-zinc-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCreatePlaylist}
        disabled={isLoading}
        className="bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-semibold px-10 py-4 rounded-full text-lg transition-colors flex items-center gap-3"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
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
            Connecting...
          </>
        ) : (
          <>
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Create Playlist
          </>
        )}
      </button>

      <p className="text-zinc-500 text-sm mt-12">
        Powered by Spotify
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
