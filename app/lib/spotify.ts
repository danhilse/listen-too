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

  console.log('[spotify] Fetching top tracks:', { timePeriod, limit });

  while (tracks.length < limit) {
    const fetchLimit = Math.min(maxPerRequest, limit - tracks.length);
    const url = `${SPOTIFY_API_BASE}/me/top/tracks?time_range=${timePeriod}&limit=${fetchLimit}&offset=${offset}`;
    console.log('[spotify] Fetching:', url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[spotify] Top tracks error:', response.status, errorText);
      throw new Error(`Failed to fetch top tracks: ${response.status}`);
    }

    const data = await response.json();
    console.log('[spotify] Top tracks response items:', data.items?.length || 0);

    if (!data.items) {
      console.error('[spotify] No items in response:', data);
      break;
    }

    tracks.push(...data.items);

    if (data.items.length < fetchLimit) {
      break; // No more tracks available
    }

    offset += fetchLimit;
  }

  console.log('[spotify] Total top tracks fetched:', tracks.length);
  return tracks;
}

export async function fetchLikedTracks(
  accessToken: string,
  timePeriod: TimePeriod,
  targetCount: number
): Promise<Track[]> {
  const cutoffDays = TIME_PERIOD_DAYS[timePeriod];
  const cutoffDate = cutoffDays ? new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000) : null;

  console.log('[spotify] Fetching liked tracks:', { timePeriod, targetCount, cutoffDays, cutoffDate });

  const tracks: Track[] = [];
  const maxPerRequest = 50;
  let offset = 0;
  // Fetch more than needed since we're filtering by date
  const maxToFetch = cutoffDate ? targetCount * 4 : targetCount;

  while (tracks.length < targetCount && offset < maxToFetch) {
    const url = `${SPOTIFY_API_BASE}/me/tracks?limit=${maxPerRequest}&offset=${offset}`;
    console.log('[spotify] Fetching:', url);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[spotify] Liked tracks error:', response.status, errorText);
      throw new Error(`Failed to fetch liked tracks: ${response.status}`);
    }

    const data = await response.json();
    console.log('[spotify] Liked tracks response items:', data.items?.length || 0);

    if (!data.items) {
      console.error('[spotify] No items in response:', data);
      break;
    }

    for (const item of data.items as SavedTrack[]) {
      // If we have a cutoff date, check if track was added after it
      if (cutoffDate) {
        const addedAt = new Date(item.added_at);
        if (addedAt < cutoffDate) {
          console.log('[spotify] Hit cutoff date, stopping. Found:', tracks.length);
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

  console.log('[spotify] Total liked tracks fetched:', tracks.length);
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
  console.log('[spotify] Adding tracks to playlist:', playlistId, 'count:', trackUris.length);

  if (trackUris.length === 0) {
    console.log('[spotify] No tracks to add, skipping');
    return;
  }

  // Spotify allows max 100 tracks per request
  const chunkSize = 100;

  for (let i = 0; i < trackUris.length; i += chunkSize) {
    const chunk = trackUris.slice(i, i + chunkSize);
    console.log('[spotify] Adding chunk:', i, 'to', i + chunk.length);

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
      const errorText = await response.text();
      console.error('[spotify] Add tracks error:', response.status, errorText);
      throw new Error(`Failed to add tracks: ${response.status}`);
    }

    const result = await response.json();
    console.log('[spotify] Add tracks result:', result);
  }

  console.log('[spotify] All tracks added successfully');
}
