'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { initiateSpotifyLogin } from '@/utils/auth';
import { SpotifyButton } from '@/components/spotify/SpotifyButton';
import { TIME_RANGES } from '@/utils/spotify';

export default function Home() {
  const [songCount, setSongCount] = useState("20");
  const [timeRange, setTimeRange] = useState("medium_term");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Clear any existing storage first
      sessionStorage.removeItem('playlist_config');
      localStorage.removeItem('playlist_config_backup');
      
      const config = {
        numberOfSongs: parseInt(songCount),
        timeRange
      };
      
      console.log('Storing configuration...', config);
      
      // Store in session storage
      sessionStorage.setItem('playlist_config', JSON.stringify(config));
      
      // Store backup in local storage with timestamp
      const backupData = {
        config,
        timestamp: Date.now()
      };
      localStorage.setItem('playlist_config_backup', JSON.stringify(backupData));
      
      // Verify storage
      const storedSession = sessionStorage.getItem('playlist_config');
      const storedBackup = localStorage.getItem('playlist_config_backup');
      
      console.log('Verification - Session Storage:', storedSession);
      console.log('Verification - Local Storage:', storedBackup);
      
      if (!storedSession || !storedBackup) {
        throw new Error('Failed to store configuration');
      }
      
      // Small delay to ensure storage is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Initiate Spotify login
      initiateSpotifyLogin();
    } catch (error) {
      console.error('Login preparation error:', error);
      setIsLoading(false);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="min-h-screen bg-[#111215] relative overflow-hidden">
      <div className="absolute top-0 right-0 h-full w-[70%] z-0 max-md:w-full max-md:h-[45%] max-md:top-auto max-md:bottom-0">
        <Image
          src="/mountain.jpg"
          alt="Colorful mountain landscape"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="absolute inset-y-0 left-0 w-[680px] bg-gradient-to-r from-[#111215] via-[#111215]/80 to-transparent z-10 max-md:w-full max-md:h-full max-md:bg-gradient-to-b" />

      <div className="relative min-h-screen pl-8 pt-4 pb-4 pr-8 flex flex-col z-20 max-md:px-6">
        <div className="text-white text-2xl font-medium mb-12">
          listen too *
        </div>

        <main className="flex-1 flex items-center max-md:items-start">
          <div className="min-w-[60%] flex justify-center max-md:w-full max-md:min-w-0">
            <div className="max-w-[680px] w-full space-y-8">
              <h1 className="text-5xl font-bold text-white leading-tight max-md:text-4xl">
                Create a playlist of your most played songs, ready to share in seconds.
              </h1>
              
              <div className="w-fit max-md:w-full">
                <div className="flex items-center flex-wrap gap-2 text-lg text-zinc-300 mb-6 max-md:flex-col max-md:items-start max-md:gap-4">
                  <span>I want to share my</span>
                  <Select value={songCount} onValueChange={setSongCount}>
                    <SelectTrigger className="w-[200px] bg-transparent border-white bg-[#111215]/10 backdrop-blur-md border-white max-md:w-full">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111215]/90 backdrop-blur-md border-white">
                      {[10, 20, 50].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} most-played songs
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>from the</span>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[150px] bg-transparent border-white bg-[#111215]/10 backdrop-blur-md border-white max-md:w-full">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111215]/90 backdrop-blur-md border-white">
                      {TIME_RANGES.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center w-full">
        <SpotifyButton 
          onClick={handleLogin} 
          disabled={isLoading}
          text={isLoading ? "Preparing..." : "Continue with Spotify"}
        />
      </div>
              </div>
            </div>
          </div>
        </main>
      
        <div className="flex gap-8 text-zinc-500/50 mt-12 max-md:gap-4 max-md:mt-8">
          <div className="text-sm">Built by Daniel Hilse</div>
          <Link href="https://github.com/yourusername" className="text-sm hover:text-zinc-300 transition-colors">
            GitHub
          </Link>
          <Link href="https://linkedin.com/in/yourusername" className="text-sm hover:text-zinc-300 transition-colors">
            LinkedIn
          </Link>
        </div>
      </div>
    </div>
  );
}