import { NextRequest, NextResponse } from 'next/server';
import { setAuthStateCookie, generateCSRF } from '@/app/lib/session';
import { SPOTIFY_SCOPES } from '@/app/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackCount = searchParams.get('trackCount') || '10';
  const timePeriod = searchParams.get('timePeriod') || 'short_term';

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL('/?error=config_error', request.url));
  }

  const csrf = generateCSRF();

  // Store state in cookie for validation on callback
  await setAuthStateCookie({
    trackCount,
    timePeriod,
    csrf,
  });

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', SPOTIFY_SCOPES);
  authUrl.searchParams.set('state', csrf);

  return NextResponse.redirect(authUrl.toString());
}
