// src/utils/spotify.ts

import type {
  Track,
  SpotifyTrack,
  TimeRangeOption,
  TimeRangeValue,
  TopTracksResponse,
  PaginationParams,
  PlaylistResponse,
  
  SpotifyUserProfile,
  SpotifyArtistDetails,
  
  SavedTrackResponse
} from '@/types/spotify';

import { categorizeGenre } from './genres';

// Add the missing fetchArtistDetails function
async function fetchArtistDetails(token: string, artistId: string): Promise<SpotifyArtistDetails> {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch artist details for ${artistId}`);
  }

  return response.json();
}

// Add the getLikedSongs function
export async function getLikedSongs(
  token: string,
  { limit = 10, offset = 0 }: PaginationParams
): Promise<Track[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch liked songs');
  }

  const data: SavedTrackResponse = await response.json();
  
  // Fetch artist details for each track
  const enrichedTracks = await Promise.all(
    data.items.map(async (item) => {
      const artistDetails = await Promise.all(
        item.track.artists.map(artist => fetchArtistDetails(token, artist.id))
      );

      return {
        id: item.track.id,
        name: item.track.name,
        uri: item.track.uri,
        artists: artistDetails,
        album: item.track.album,
        added_at: item.added_at
      };
    })
  );

  return enrichedTracks.map(track => ({
    ...track,
    source: 'liked'
  }));
}

export const PLAYLIST_NAME = 'My Most Played Songs';

export const TIME_RANGES: TimeRangeOption[] = [
  {
    value: 'short_term',
    label: 'last 4 weeks.',
    spotifyRange: 'short_term'
  },
  {
    value: 'medium_term',
    label: 'last 6 months.',
    spotifyRange: 'medium_term'
  },
  {
    value: 'long_term',
    label: 'last year.',
    spotifyRange: 'long_term'
  }
];


export async function getTopSongs(
  token: string,
  timeRange: TimeRangeValue,
  { limit = 20, offset = 0 } = {}
): Promise<Track[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&offset=${offset}&time_range=${timeRange}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch top songs');
  }

  const data: TopTracksResponse = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('No tracks returned from Spotify API');
  }

  return data.items.map((track: SpotifyTrack) => ({
    id: track.id,
    name: track.name,
    uri: track.uri,
    artists: track.artists.map(artist => ({
      ...artist,
      genres: [], // Will be populated by artist details fetch
      images: []  // Will be populated by artist details fetch
    })),
    album: track.album,
    source: 'top'
  }));
}

export async function loadMoreSongsUntilTarget(
  token: string,
  currentLikedSongs: Track[],
  currentTopSongs: Track[],
  activeGenres: Set<string>,
  // targetCount: number = 10
): Promise<{ likedSongs: Track[], topSongs: Track[] }> {
  const batchSize = 50;
  let newLikedSongs = [...currentLikedSongs];
  let newTopSongs = [...currentTopSongs];
  
  try {
    const [moreLiked, moreTop] = await Promise.all([
      getLikedSongs(token, { 
        offset: currentLikedSongs.length, 
        limit: batchSize 
      }),
      getTopSongs(token, 'long_term', { 
        offset: currentTopSongs.length, 
        limit: batchSize 
      })
    ]);

    const allLikedIds = new Set(newLikedSongs.map((s: Track) => s.id));
    const allTopIds = new Set(newTopSongs.map((s: Track) => s.id));

    const uniqueNewLiked = moreLiked.filter((song: Track) => !allLikedIds.has(song.id));
    const uniqueNewTop = moreTop.filter((song: Track) => !allTopIds.has(song.id));

    newLikedSongs = [...newLikedSongs, ...uniqueNewLiked];
    newTopSongs = [...newTopSongs, ...uniqueNewTop];

    if (activeGenres.size > 0) {
      const filterByGenre = (track: Track) =>
        track.artists.some(artist =>
          artist.genres?.some(genre =>
            activeGenres.has(categorizeGenre(genre))
          )
        );

      newLikedSongs = newLikedSongs.filter(filterByGenre);
      newTopSongs = newTopSongs.filter(filterByGenre);
    }

    console.log('Loaded more songs:', {
      liked: {
        before: currentLikedSongs.length,
        after: newLikedSongs.length
      },
      top: {
        before: currentTopSongs.length,
        after: newTopSongs.length
      }
    });

  } catch (error) {
    console.error('Error loading more songs:', error);
    throw error;
  }

  return {
    likedSongs: newLikedSongs,
    topSongs: newTopSongs
  };
}
export async function verifyPremiumUser(token: string): Promise<boolean> {
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  const profile: SpotifyUserProfile = await response.json();
  return profile.product === 'premium';
}
async function generatePlaylistCoverArt(
  tracks: Track[],
  token: string,
  playlistId: string
): Promise<boolean> {
  const size = 640;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Failed to get canvas context');
  
  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  const gridSize = tracks.length <= 10 ? 3 : tracks.length <= 20 ? 5 : 7;
  const tileSize = size / gridSize;

  try {
    await document.fonts.load(`bold ${Math.round(size * 0.12)}px Inter`);

    // Get all album images
    const images = await Promise.all(
      tracks.map(track => {
        if (!track.album?.images?.length) return null;
        const highestRes = [...track.album.images].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image from ${highestRes.url}`));
          img.src = highestRes.url;
        });
      }).filter((img): img is Promise<HTMLImageElement> => img !== null)
    );

    // Fill grid
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const index = (y * gridSize + x) % images.length;
        ctx.drawImage(images[index], x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Overlay and text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(size * 0.12)}px Inter`;
    ctx.fillText('listen too *', size / 2 + size * .012, size * 0.45);
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    
    // Upload
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/images`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'image/jpeg'
            },
            body: base64Image
          }
        );
        
        if (response.ok) return true;
        if (response.status === 502 && i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(`Failed to upload playlist cover image. Status: ${response.status}`);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in generatePlaylistCoverArt:', error);
    throw error;
  }
}
// Update createPlaylist function to include cover art generation
export async function createPlaylist(
  token: string,
  userId: string,
  tracks: Track[]
): Promise<{ url: string }> {
  const isPremium = await verifyPremiumUser(token);
  if (!isPremium) {
    throw new Error('Playlist creation requires a Spotify Premium subscription');
  }

  try {
    const playlistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${PLAYLIST_NAME} - ${new Date().toLocaleDateString()}`,
          description: `Created with Spotify Playlist Creator`,
          public: false
        }),
      }
    );

    if (!playlistResponse.ok) {
      const errorData = await playlistResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create playlist');
    }

    const playlist: PlaylistResponse = await playlistResponse.json();

    if (!playlist.id || !playlist.external_urls?.spotify) {
      throw new Error('Invalid playlist response from Spotify');
    }

    // Separate and interlace tracks
    const likedTracks = tracks.filter(track => track.source === 'liked');
    const topTracks = tracks.filter(track => track.source === 'top');
    
    const interlacedUris: string[] = [];
    const maxLength = Math.max(likedTracks.length, topTracks.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < likedTracks.length) {
        interlacedUris.push(likedTracks[i].uri);
      }
      if (i < topTracks.length) {
        interlacedUris.push(topTracks[i].uri);
      }
    }

    const batchSize = 100;
    for (let i = 0; i < interlacedUris.length; i += batchSize) {
      const batch = interlacedUris.slice(i, i + batchSize);
      const addTracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: batch,
          }),
        }
      );

      if (!addTracksResponse.ok) {
        const errorData = await addTracksResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to add tracks to playlist');
      }
    }

    // Generate and upload cover art
    await generatePlaylistCoverArt(tracks, token, playlist.id);

    return { url: playlist.external_urls.spotify };
  } catch (error) {
    console.error('Error in createPlaylist:', error);
    throw error;
  }
}