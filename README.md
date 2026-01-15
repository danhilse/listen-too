# Listen Too

Create a playlist of your most played Spotify songs, ready to share in seconds.

## Features

- Connect with your Spotify account
- Choose how many tracks (10, 25, or 50)
- Select time period (last month, 6 months, or year)
- Automatically creates a playlist in your Spotify library
- Copy link to share with friends

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Spotify Web API

## Getting Started

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:3000/api/auth/callback` to Redirect URIs
4. Note your Client ID and Client Secret

### 2. Environment Variables

Create a `.env.local` file:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy to Vercel and update your Spotify app's Redirect URI to match your production URL.

## License

MIT
