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
import { Github, Linkedin } from 'lucide-react';
import { TimeRangeValue } from '@/types/spotify';
import { SpotifyButton } from '@/components/spotify/SpotifyButton';
import { TIME_RANGES } from '@/utils/spotify';

export default function Home() {
  const [songCount, setSongCount] = useState("20");
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("this_month");

  const handleLogin = () => {
    sessionStorage.setItem('playlist_config', JSON.stringify({
      numberOfSongs: parseInt(songCount),
      timeRange
    }));
    initiateSpotifyLogin();
  };

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute top-0 right-0 h-full w-3/5">
        <Image
          src="/mountain.jpg"
          alt="Colorful mountain landscape"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay to help text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative min-h-screen p-8 flex flex-col">
        {/* Logo */}
        <div className="text-white text-2xl font-medium mb-12">
          listen too *
        </div>

        {/* Main Content */}
        <main className="flex-1 flex items-center">
        <div className="w-full max-w-2xl">
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Create a playlist of your most played songs, ready to share in seconds.
            </h1>
            
            <div className="space-y-6">
              <div className="flex items-center flex-wrap gap-2 text-lg text-zinc-300">
                <span>I want to share my</span>
                <Select value={songCount} onValueChange={setSongCount}>
                  <SelectTrigger className="w-[180px] bg-transparent border-zinc-800">
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} most-played songs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>from</span>
                <Select value={timeRange} onValueChange={(value: TimeRangeValue) => setTimeRange(value)}>
                  <SelectTrigger className="w-[180px] bg-transparent border-zinc-800">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGES.map(range => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <SpotifyButton onClick={handleLogin} />
            </div>
          </div>
        </div>
      </main>
      
        {/* Footer Links */}
        <div className="flex gap-4 text-zinc-500">
          <div className="text-sm">Built by Daniel Hilse</div>
          <Link href="https://github.com/yourusername" className="hover:text-zinc-300 transition-colors">
            <Github className="h-5 w-5" />
          </Link>
          <Link href="https://linkedin.com/in/yourusername" className="hover:text-zinc-300 transition-colors">
            <Linkedin className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}