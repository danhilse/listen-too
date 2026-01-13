import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/app/lib/session';
import {
  getCurrentUser,
  fetchTopTracks,
  fetchLikedTracks,
  createPlaylist,
  addTracksToPlaylist,
} from '@/app/lib/spotify';
import { interweaveAndDeduplicate } from '@/app/lib/playlist-utils';
import { generatePlaylistName } from '@/app/lib/constants';
import { TimePeriod } from '@/app/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackCount = parseInt(searchParams.get('trackCount') || '10');
  const timePeriod = (searchParams.get('timePeriod') || 'short_term') as TimePeriod;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log('[playlist/create] Starting with:', { trackCount, timePeriod });

  // Get valid access token (refreshes if needed)
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    console.log('[playlist/create] No access token found');
    return NextResponse.redirect(`${baseUrl}/?error=not_authenticated`);
  }

  console.log('[playlist/create] Got access token');

  try {
    // 1. Get current user
    const user = await getCurrentUser(accessToken);
    console.log('[playlist/create] User:', user.id, user.display_name);

    // 2. Fetch top tracks (request extra to account for deduplication)
    const topTracks = await fetchTopTracks(accessToken, timePeriod, trackCount * 2);
    console.log('[playlist/create] Top tracks fetched:', topTracks.length);

    // 3. Fetch liked tracks with date filtering
    const likedTracks = await fetchLikedTracks(accessToken, timePeriod, trackCount * 2);
    console.log('[playlist/create] Liked tracks fetched:', likedTracks.length);

    // 4. Interweave and deduplicate
    const finalTracks = interweaveAndDeduplicate(topTracks, likedTracks, trackCount);
    console.log('[playlist/create] Final tracks after interweave:', finalTracks.length);

    // Handle case where we don't have enough tracks
    if (finalTracks.length === 0) {
      console.log('[playlist/create] No tracks found, redirecting with error');
      return NextResponse.redirect(`${baseUrl}/?error=no_tracks`);
    }

    // 5. Create playlist
    const playlistName = generatePlaylistName(timePeriod, finalTracks.length);
    console.log('[playlist/create] Creating playlist:', playlistName);

    const playlist = await createPlaylist(accessToken, user.id, {
      name: playlistName,
      description: `My top ${finalTracks.length} tracks - created with Listen Too`,
      public: true,
    });
    console.log('[playlist/create] Playlist created:', playlist.id);

    // 6. Add tracks to playlist
    const trackUris = finalTracks.map((track) => track.uri);
    console.log('[playlist/create] Adding tracks:', trackUris.length, 'URIs');
    console.log('[playlist/create] First few URIs:', trackUris.slice(0, 3));

    await addTracksToPlaylist(accessToken, playlist.id, trackUris);
    console.log('[playlist/create] Tracks added successfully');

    // 7. Wait for Spotify to propagate the playlist
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('[playlist/create] Waited for propagation');

    // 8. Redirect to success page
    const successUrl = new URL(`${baseUrl}/success`);
    successUrl.searchParams.set('playlistId', playlist.id);
    successUrl.searchParams.set('playlistUrl', playlist.external_urls.spotify);
    successUrl.searchParams.set('trackCount', finalTracks.length.toString());

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('[playlist/create] Error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=creation_failed`);
  }
}
