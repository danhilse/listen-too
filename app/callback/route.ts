import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthStateCookie,
  clearAuthStateCookie,
  setTokenCookie,
} from '@/app/lib/session';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Handle user denying access
  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=auth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_params`);
  }

  // Validate state from cookie
  const authState = await getAuthStateCookie();
  if (!authState || authState.csrf !== state) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid_state`);
  }

  // Clear auth state cookie
  await clearAuthStateCookie();

  // Exchange code for tokens
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}));
    console.error('Token exchange failed:', errorData);
    return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
  }

  const tokenData = await tokenResponse.json();

  // Store tokens in encrypted cookie
  await setTokenCookie({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: Date.now() + tokenData.expires_in * 1000,
  });

  // Redirect to playlist creation with stored preferences
  const createUrl = new URL(`${baseUrl}/api/playlist/create`);
  createUrl.searchParams.set('trackCount', authState.trackCount);
  createUrl.searchParams.set('timePeriod', authState.timePeriod);

  return NextResponse.redirect(createUrl.toString());
}
