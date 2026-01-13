import { cookies } from 'next/headers';
import { TokenPair, SpotifyAuthState } from './types';

const TOKEN_COOKIE_NAME = 'spotify_tokens';
const STATE_COOKIE_NAME = 'spotify_auth_state';

function getSecret(): string {
  const secret = process.env.TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('TOKEN_SECRET must be at least 32 characters');
  }
  return secret;
}

export async function encryptData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret().slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    secretKey,
    encoder.encode(data)
  );

  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString('base64');
}

export async function decryptData(encryptedData: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret().slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const combined = Buffer.from(encryptedData, 'base64');
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    secretKey,
    encrypted
  );

  return decoder.decode(decrypted);
}

export function generateCSRF(): string {
  return crypto.randomUUID();
}

export async function setTokenCookie(tokens: TokenPair): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = await encryptData(JSON.stringify(tokens));

  cookieStore.set(TOKEN_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getTokensFromCookie(): Promise<TokenPair | null> {
  const cookieStore = await cookies();
  const encrypted = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!encrypted) {
    return null;
  }

  try {
    const decrypted = await decryptData(encrypted);
    return JSON.parse(decrypted) as TokenPair;
  } catch {
    return null;
  }
}

export async function clearTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

export async function setAuthStateCookie(state: SpotifyAuthState): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = await encryptData(JSON.stringify(state));

  cookieStore.set(STATE_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });
}

export async function getAuthStateCookie(): Promise<SpotifyAuthState | null> {
  const cookieStore = await cookies();
  const encrypted = cookieStore.get(STATE_COOKIE_NAME)?.value;

  if (!encrypted) {
    return null;
  }

  try {
    const decrypted = await decryptData(encrypted);
    return JSON.parse(decrypted) as SpotifyAuthState;
  } catch {
    return null;
  }
}

export async function clearAuthStateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STATE_COOKIE_NAME);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokensFromCookie();

  if (!tokens) {
    return null;
  }

  // Refresh if less than 5 minutes until expiration
  if (tokens.expires_at - Date.now() < 5 * 60 * 1000) {
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      await setTokenCookie(newTokens);
      return newTokens.access_token;
    } catch {
      return null;
    }
  }

  return tokens.access_token;
}
