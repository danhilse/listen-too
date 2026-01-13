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

  // Get valid access token (refreshes if needed)
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.redirect(`${baseUrl}/?error=not_authenticated`);
  }

  try {
    // 1. Get current user
    const user = await getCurrentUser(accessToken);

    // 2. Fetch top tracks (request extra to account for deduplication)
    const topTracks = await fetchTopTracks(accessToken, timePeriod, trackCount * 2);

    // 3. Fetch liked tracks with date filtering
    const likedTracks = await fetchLikedTracks(accessToken, timePeriod, trackCount * 2);

    // 4. Interweave and deduplicate
    const finalTracks = interweaveAndDeduplicate(topTracks, likedTracks, trackCount);

    // Handle case where we don't have enough tracks
    if (finalTracks.length === 0) {
      return NextResponse.redirect(`${baseUrl}/?error=no_tracks`);
    }

    // 5. Create playlist
    const playlistName = generatePlaylistName(timePeriod, finalTracks.length);
    const playlist = await createPlaylist(accessToken, user.id, {
      name: playlistName,
      description: `My top ${finalTracks.length} tracks - created with Listen Too`,
      public: true,
    });

    // 6. Add tracks to playlist
    const trackUris = finalTracks.map((track) => track.uri);
    await addTracksToPlaylist(accessToken, playlist.id, trackUris);

    // 7. Redirect to success page
    const successUrl = new URL(`${baseUrl}/success`);
    successUrl.searchParams.set('playlistId', playlist.id);
    successUrl.searchParams.set('playlistUrl', playlist.external_urls.spotify);
    successUrl.searchParams.set('trackCount', finalTracks.length.toString());

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error('Playlist creation failed:', error);
    return NextResponse.redirect(`${baseUrl}/?error=creation_failed`);
  }
}
