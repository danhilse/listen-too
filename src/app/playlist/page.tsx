// src/app/playlist/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTopSongs, createPlaylist } from '@/utils/spotify';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { PlaylistConfig } from '@/types/spotify';

export default function PlaylistPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

  useEffect(() => {
    const createUserPlaylist = async () => {
      console.log('Starting playlist creation...');
      const token = sessionStorage.getItem('spotify_token');
      const configStr = sessionStorage.getItem('playlist_config');

      if (!token || !configStr) {
        console.error('Missing token or config:', { token: !!token, config: !!configStr });
        setError('Missing authentication or configuration');
        return;
      }

      try {
        setIsLoading(true);
        const config = JSON.parse(configStr) as PlaylistConfig;
        console.log('Using config:', config);

        // Get user's profile
        console.log('Fetching user profile...');
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await userResponse.json();
        console.log('User data received:', userData.id);

        // Get top tracks with the specified time range
        console.log('Fetching top tracks...');
        const topTracks = await getTopSongs(
          token,
          config.timeRange,
          { limit: config.numberOfSongs }
        );
        console.log(`Fetched ${topTracks.length} tracks`);

        // Create playlist
        console.log('Creating playlist...');
        const { url } = await createPlaylist(token, userData.id, topTracks);
        console.log('Playlist created:', url);
        setPlaylistUrl(url);

      } catch (err) {
        console.error('Playlist creation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to create playlist');
      } finally {
        setIsLoading(false);
      }
    };

    createUserPlaylist();
  }, [router]);
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <Button 
          onClick={() => {
            sessionStorage.clear();
            router.push('/');
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <div className="text-lg">Creating your playlist...</div>
          </div>
        ) : playlistUrl ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Your Playlist is Ready!</h1>
              <div className="space-x-4">
                <Button
                  onClick={() => window.open(playlistUrl, '_blank')}
                  className="bg-[#1DB954] hover:bg-[#1ed760]"
                >
                  Open in Spotify
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(playlistUrl);
                  }}
                  variant="outline"
                >
                  Copy Link
                </Button>
              </div>
            </div>

            <div className="aspect-video w-full">
              <iframe
                src={`https://open.spotify.com/embed/playlist/${playlistUrl.split('/').pop()}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="rounded-lg"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}