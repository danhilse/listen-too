import { SpotifyUser, Track, Playlist, SavedTrack, TimePeriod, PlaylistCreationOptions } from './types';
import { TIME_PERIOD_DAYS } from './constants';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function getCurrentUser(accessToken: string): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.status}`);
  }

  return response.json();
}

export async function fetchTopTracks(
  accessToken: string,
  timePeriod: TimePeriod,
  limit: number
): Promise<Track[]> {
  const tracks: Track[] = [];
  const maxPerRequest = 50;
  let offset = 0;

  while (tracks.length < limit) {
    const fetchLimit = Math.min(maxPerRequest, limit - tracks.length);
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/top/tracks?time_range=${timePeriod}&limit=${fetchLimit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch top tracks: ${response.status}`);
    }

    const data = await response.json();
    tracks.push(...data.items);

    if (data.items.length < fetchLimit) {
      break; // No more tracks available
    }

    offset += fetchLimit;
  }

  return tracks;
}

export async function fetchLikedTracks(
  accessToken: string,
  timePeriod: TimePeriod,
  targetCount: number
): Promise<Track[]> {
  const cutoffDays = TIME_PERIOD_DAYS[timePeriod];
  const cutoffDate = cutoffDays ? new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000) : null;

  const tracks: Track[] = [];
  const maxPerRequest = 50;
  let offset = 0;
  // Fetch more than needed since we're filtering by date
  const maxToFetch = cutoffDate ? targetCount * 4 : targetCount;

  while (tracks.length < targetCount && offset < maxToFetch) {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/me/tracks?limit=${maxPerRequest}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch liked tracks: ${response.status}`);
    }

    const data = await response.json();

    for (const item of data.items as SavedTrack[]) {
      // If we have a cutoff date, check if track was added after it
      if (cutoffDate) {
        const addedAt = new Date(item.added_at);
        if (addedAt < cutoffDate) {
          // Tracks are sorted by added_at desc, so we can stop
          return tracks.slice(0, targetCount);
        }
      }

      tracks.push(item.track);

      if (tracks.length >= targetCount) {
        break;
      }
    }

    if (data.items.length < maxPerRequest) {
      break; // No more tracks available
    }

    offset += maxPerRequest;
  }

  return tracks.slice(0, targetCount);
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  options: PlaylistCreationOptions
): Promise<Playlist> {
  const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      public: options.public,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create playlist: ${response.status}`);
  }

  return response.json();
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  // Spotify allows max 100 tracks per request
  const chunkSize = 100;

  for (let i = 0; i < trackUris.length; i += chunkSize) {
    const chunk = trackUris.slice(i, i + chunkSize);

    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: chunk }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add tracks: ${response.status}`);
    }
  }
}
