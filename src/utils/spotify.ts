// src/utils/spotify.ts

import type {
  Track,
  TimeRangeValue,
  TimeRangeOption,
  TopTracksResponse,
  PaginationParams,
  PlaylistResponse,
  
  SpotifyUserProfile,
  SpotifyArtistDetails,
  
  SavedTrackResponse
} from '@/types/spotify';

import { categorizeGenre } from './genres';

export const PLAYLIST_NAME = 'My Most Played Songs';

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

export const TIME_RANGES: TimeRangeOption[] = [
  {
    value: 'today',
    label: '24 hours',
    spotifyRange: 'short_term',
    daysToInclude: 1
  },
  {
    value: 'this_week',
    label: '7 days',
    spotifyRange: 'short_term',
    daysToInclude: 7
  },
  {
    value: 'this_month',
    label: '30 days',
    spotifyRange: 'short_term',
    daysToInclude: 30
  },
  {
    value: 'last_3_months',
    label: '3 months',
    spotifyRange: 'medium_term',
    daysToInclude: 90
  },
  {
    value: 'last_6_months',
    label: '6 months',
    spotifyRange: 'medium_term',
    daysToInclude: 180
  },
  {
    value: 'last_year',
    label: '12 months',
    spotifyRange: 'long_term',
    daysToInclude: 365
  },
  {
    value: 'all_time',
    label: 'All time',
    spotifyRange: 'long_term'
  }
];

export async function getTopSongs(
  token: string,
  timeRange: TimeRangeValue,
  { limit = 10, offset = 0 }: PaginationParams = {}
): Promise<Track[]> {
  const rangeConfig = TIME_RANGES.find(r => r.value === timeRange);
  if (!rangeConfig) {
    throw new Error('Invalid time range specified');
  }

  const fetchLimit = rangeConfig.daysToInclude ? Math.ceil(limit * 1.5) : limit;

  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=${fetchLimit}&offset=${offset}&time_range=${rangeConfig.spotifyRange}`,
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
  
  const enrichedTracks = await Promise.all(
    data.items.map(async (track) => {
      const artistDetails = await Promise.all(
        track.artists.map(artist => fetchArtistDetails(token, artist.id))
      );

      return {
        id: track.id,
        name: track.name,
        uri: track.uri,
        artists: artistDetails,
        album: track.album,
        added_at: new Date().toISOString()
      };
    })
  );

  let filteredTracks = enrichedTracks;

  if (rangeConfig.daysToInclude) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rangeConfig.daysToInclude);
    
    filteredTracks = enrichedTracks
      .filter(track => new Date(track.added_at) >= cutoffDate);
  }

  return filteredTracks
    .slice(0, limit)
    .map(track => ({
      ...track,
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
      getTopSongs(token, 'all_time', { 
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

// Update the createPlaylist function
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

    return { url: playlist.external_urls.spotify };
  } catch (error) {
    console.error('Error in createPlaylist:', error);
    throw error;
  }
}
