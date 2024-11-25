// src/types/spotify.ts

// Base types for Spotify entities
export interface SpotifyImage {
    url: string;
    height: number;
    width: number;
  }
  
  export interface SpotifyArtist {
    id: string;
    name: string;
    uri: string;
  }
  
  export interface SpotifyArtistDetails extends SpotifyArtist {
    genres: string[];
    images: SpotifyImage[];
  }
  
  export interface SpotifyAlbum {
    id: string;
    name: string;
    images: SpotifyImage[];
    uri: string;
  }
  
  export interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
  }
  
  // Application-specific types
  export interface Track {
    id: string;
    name: string;
    uri: string;
    source: 'liked' | 'top';
    artists: SpotifyArtistDetails[];
    album: SpotifyAlbum;
    added_at?: string;
  }
  
  // Time range related types
  export type SpotifyTimeRange = 'short_term' | 'medium_term' | 'long_term';
  
  export type TimeRangeValue = 
    | 'today'
    | 'this_week'
    | 'this_month'
    | 'last_3_months'
    | 'last_6_months'
    | 'last_year'
    | 'all_time';
  
  export interface TimeRangeOption {
    value: TimeRangeValue;
    label: string;
    spotifyRange: SpotifyTimeRange;
    daysToInclude?: number;
  }
  
  // API response types
  export interface SavedTrackResponse {
    items: Array<{
      added_at: string;
      track: SpotifyTrack;
    }>;
  }
  
  export interface TopTracksResponse {
    items: SpotifyTrack[];
  }
  
  export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    external_urls: {
      spotify: string;
    };
    owner?: {
      display_name: string;
    };
  }
  
  export interface PlaylistResponse {
    id: string;
    external_urls: {
      spotify: string;
    };
  }
  
  export interface PlaylistsResponse {
    items: SpotifyPlaylist[];
    next: string | null;
    total: number;
  }
  
  // Configuration types
  export interface PlaylistConfig {
    numberOfSongs: number;
    timeRange: TimeRangeValue;
  }
  
  export interface PaginationParams {
    limit?: number;
    offset?: number;
  }
  
  // User profile types
  export interface SpotifyUserProfile {
    product: string;
    id: string;
    // Add other user profile fields as needed
  }