// src/utils/genres.ts

import { Track } from '@/types/spotify';

// Main genre categories mapping
export const genreCategories: Record<string, string[]> = {
  "Pop": [
    "pop", "dance pop", "electropop", "indie pop", "synth-pop",
    "adult contemporary", "contemporary", "modern"
  ],
  "Rock": [
    "rock", "alternative rock", "indie rock", "hard rock", "classic rock",
    "metal", "punk", "grunge"
  ],
  "Hip Hop": [
    "hip hop", "rap", "trap", "conscious hip hop", "southern hip hop",
    "gangster rap", "urban contemporary"
  ],
  "Electronic": [
    "electronic", "edm", "house", "techno", "dubstep", "trance",
    "ambient", "electronica"
  ],
  "R&B": [
    "r&b", "soul", "funk", "neo soul", "contemporary r&b",
    "motown", "quiet storm"
  ],
  "Jazz & Blues": [
    "jazz", "blues", "swing", "bebop", "smooth jazz",
    "big band", "classical jazz"
  ],
  "Folk & Country": [
    "folk", "country", "americana", "bluegrass", "singer-songwriter",
    "traditional folk", "contemporary country"
  ],
  "World": [
    "latin", "reggae", "afrobeat", "world", "bossa nova",
    "samba", "k-pop", "j-pop"
  ]
};

// Function to categorize a specific genre
export function categorizeGenre(genre: string): string {
  const normalizedGenre = genre.toLowerCase();
  for (const [category, subgenres] of Object.entries(genreCategories)) {
    if (subgenres.some(sub => normalizedGenre.includes(sub))) {
      return category;
    }
  }
  return "Other";
}

// Function to get genre stats from tracks
export function getGenreStats(tracks: Track[]) {
  console.log('Processing tracks for genres:', tracks); // Debug log

  const genreCounts = new Map<string, number>();
  const processedTracks = new Set<string>(); // To avoid counting the same track twice

  tracks.forEach(track => {
    if (processedTracks.has(track.id)) return;
    processedTracks.add(track.id);

    const trackCategories = new Set<string>();

    // Process each artist's genres
    track.artists.forEach(artist => {
      if (artist.genres) {
        artist.genres.forEach(genre => {
          const category = categorizeGenre(genre);
          trackCategories.add(category);
        });
      } else {
        // If no genres, count as "Other"
        trackCategories.add("Other");
      }
    });

    // Count each category once per track
    trackCategories.forEach(category => {
      genreCounts.set(category, (genreCounts.get(category) || 0) + 1);
    });
  });

  const totalTracks = processedTracks.size;
  
  // Convert to percentage and sort
  return Array.from(genreCounts.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalTracks) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}