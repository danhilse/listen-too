'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAuth } from '@/utils/auth';
import { PlaylistConfig } from '@/types/spotify';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PlaylistCreator from '@/components/spotify/PlaylistCreator';

export default function CreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [config] = useState<PlaylistConfig>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('playlist_config');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.push('/');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!config) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Creating Your Playlist</h1>
        {/* Add your playlist creation UI here */}
      </div>
    </main>
  );
}