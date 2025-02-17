import { spotifyConfig, validateConfig } from '@/config/spotify';

interface AuthToken {
  accessToken: string;
  expiresAt: number;
}

export function getAuthUrl() {
  validateConfig();
  const redirectUri = spotifyConfig.redirectUri;
  console.log('Current origin:', typeof window !== 'undefined' ? window.location.origin : 'SSR');
  console.log('Using redirect URI:', redirectUri);
  
  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId!,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: spotifyConfig.scopes.join(' '),
    show_dialog: 'true'
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log('Generated auth URL:', authUrl);
  return authUrl;
}

export function getStoredAuth(): AuthToken | null {
  if (typeof window === 'undefined') return null;
  
  const storedAuth = localStorage.getItem('spotify_auth');
  if (!storedAuth) return null;

  try {
    const auth = JSON.parse(storedAuth);
    if (Date.now() >= auth.expiresAt) {
      localStorage.removeItem('spotify_auth');
      return null;
    }
    return auth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    localStorage.removeItem('spotify_auth');
    return null;
  }
}

export function storeAuth(accessToken: string, expiresIn: number) {
  console.log('Storing auth token...');
  const auth: AuthToken = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  localStorage.setItem('spotify_auth', JSON.stringify(auth));
  return auth;
}

export function handleSpotifyRedirect(): AuthToken | null {
  if (typeof window === 'undefined') return null;
  
  console.log('Handling Spotify redirect on:', window.location.pathname);
  const hash = window.location.hash.substring(1);
  console.log('Hash present:', !!hash);
  
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  
  console.log('Token present:', !!accessToken);
  
  if (accessToken && expiresIn) {
    return storeAuth(accessToken, Number(expiresIn));
  }
  
  return null;
}

export function initiateSpotifyLogin() {
  console.log('Initiating Spotify login...');
  try {
    validateConfig();
    const authUrl = getAuthUrl();
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}