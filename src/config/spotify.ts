interface SpotifyConfig {
  clientId: string | undefined;
  redirectUri: string;
  scopes: readonly string[];
}

function getRedirectUri(): string {
  // First check for explicit environment variable
  if (process.env.NEXT_PUBLIC_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_REDIRECT_URI;
  }

  // Check for Vercel deployment URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // In development or if no other URI is available, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // If we're on the client side and no other URI is set, use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  throw new Error('No redirect URI available');
}

export const spotifyConfig: SpotifyConfig = {
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  redirectUri: getRedirectUri(),
  scopes: [
    'user-read-private',
    'user-library-read',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
    'ugc-image-upload'  // Add this scope for playlist image uploads
  ] as const
};

export function validateConfig() {
  if (!spotifyConfig.clientId) {
    throw new Error('Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID in environment variables');
  }
  
  if (!spotifyConfig.redirectUri) {
    throw new Error('Unable to determine redirect URI');
  }

  // Log the configuration in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Spotify Configuration:', {
      clientId: spotifyConfig.clientId ? '[REDACTED]' : undefined,
      redirectUri: spotifyConfig.redirectUri,
      scopes: spotifyConfig.scopes
    });
  }

  return true;
}

export { getRedirectUri };