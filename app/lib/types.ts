export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

export interface Track {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  uri: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  images: { url: string }[];
  tracks: {
    total: number;
    items: { track: Track }[];
  };
  owner: {
    id: string;
    display_name: string;
  };
  public: boolean;
  collaborative: boolean;
  external_urls: {
    spotify: string;
  };
}

export interface SavedTrack {
  added_at: string;
  track: Track;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SpotifyAuthState {
  trackCount: string;
  timePeriod: string;
  csrf: string;
}

export type TrackCount = '10' | '25' | '50';
export type TimePeriod = 'short_term' | 'medium_term' | 'long_term';

export interface PlaylistCreationOptions {
  name: string;
  description: string;
  public: boolean;
}
