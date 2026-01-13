import { TimePeriod, TrackCount } from './types';

export const TRACK_COUNT_OPTIONS: { value: TrackCount; label: string }[] = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
];

export const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'short_term', label: '4 weeks' },
  { value: 'medium_term', label: '6 months' },
  { value: 'long_term', label: 'all time' },
];

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  short_term: 'Last 4 Weeks',
  medium_term: 'Last 6 Months',
  long_term: 'All Time',
};

export const TIME_PERIOD_DAYS: Record<TimePeriod, number | null> = {
  short_term: 28,
  medium_term: 180,
  long_term: null,
};

export function generatePlaylistName(timePeriod: TimePeriod, trackCount: number): string {
  const periodLabel = TIME_PERIOD_LABELS[timePeriod];
  return `My Top ${trackCount} - ${periodLabel}`;
}

export const SPOTIFY_SCOPES = [
  'user-top-read',
  'user-library-read',
  'playlist-modify-public',
].join(' ');
