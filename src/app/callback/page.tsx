'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleSpotifyRedirect } from '@/utils/auth';

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('Handling callback...');
        if (window.opener) {
          window.opener.postMessage({ type: 'SPOTIFY_TOKEN', token: window.location.hash }, '*');
          window.close();
          return;
        }
    
        const auth = handleSpotifyRedirect();
        console.log('Auth result:', auth ? 'Token received' : 'No token');
    
        if (auth?.accessToken) {
          // Try session storage first
          let storedConfig = sessionStorage.getItem('playlist_config');
          
          // If not in session storage, check local storage backup
          if (!storedConfig) {
            const backupStr = localStorage.getItem('playlist_config_backup');
            if (backupStr) {
              const backup = JSON.parse(backupStr);
              // Check if backup is less than 5 minutes old
              if (Date.now() - backup.timestamp < 5 * 60 * 1000) {
                storedConfig = JSON.stringify(backup.config);
                // Restore to session storage
                sessionStorage.setItem('playlist_config', storedConfig);
              }
            }
          }
    
          console.log('Retrieved stored config:', storedConfig);
    
          if (!storedConfig) {
            throw new Error('No playlist configuration found');
          }
    
          // Store the token
          sessionStorage.setItem('spotify_token', auth.accessToken);
          
          // Clear backup after successful auth
          localStorage.removeItem('playlist_config_backup');
          
          router.push('/playlist');
        } else {
          throw new Error('No access token received');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };
  
    handleAuth();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
        <div className="text-red-500">Error: {error}</div>
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-zinc-800 rounded-md hover:bg-zinc-700"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="animate-pulse text-xl">Connecting to Spotify...</div>
        <div className="text-zinc-400">This will just take a moment</div>
      </div>
    </div>
  );
}