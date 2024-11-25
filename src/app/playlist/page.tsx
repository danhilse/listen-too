'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getTopSongs, createPlaylist } from '@/utils/spotify';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import type { PlaylistConfig } from '@/types/spotify';

export default function PlaylistPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const createUserPlaylist = async () => {
      const token = sessionStorage.getItem('spotify_token');
      const configStr = sessionStorage.getItem('playlist_config');

      if (!token || !configStr) {
        setError('Missing authentication or configuration');
        return;
      }

      try {
        setIsLoading(true);
        const config = JSON.parse(configStr) as PlaylistConfig;
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await userResponse.json();
        const topTracks = await getTopSongs(
          token,
          config.timeRange,
          { limit: config.numberOfSongs }
        );
        const { url } = await createPlaylist(token, userData.id, topTracks);
        setPlaylistUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create playlist');
      } finally {
        setIsLoading(false);
      }
    };

    createUserPlaylist();
  }, [router]);

  const handleCopyLink = async () => {
    if (playlistUrl) {
      await navigator.clipboard.writeText(playlistUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#111215] relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute top-0 right-0 h-full w-[70%] z-0">
        <Image
          src="/mountain.jpg"
          alt="Colorful mountain landscape"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-y-0 left-0 w-[680px] bg-gradient-to-r from-[#111215] via-[#111215]/80 to-transparent z-10" />

      {/* Content Container */}
      <div className="relative min-h-screen pl-8 pt-4 pb-4 pr-8 flex flex-col z-20">
        {/* Logo */}
        <div className="text-white text-2xl font-medium mb-12">
          listen too *
        </div>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-[680px] mx-auto">
            {error ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                <p className="text-zinc-300">{error}</p>
                <Button 
                  onClick={() => {
                    sessionStorage.clear();
                    router.push('/');
                  }}
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#1DB954]" />
                <p className="text-lg text-white">Creating your playlist...</p>
              </div>
            ) : playlistUrl ? (
              <div className="space-y-8">
                <div className="space-y-6">
                  <h1 className="text-4xl font-bold text-white">Your Playlist is Ready!</h1>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      onClick={() => window.open(playlistUrl, '_blank')}
                      className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Spotify
                    </Button>
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="border-white text-white hover:bg-white/10"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg overflow-hidden h-[480px] w-full">
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
        </main>
      </div>
    </div>
  );
}