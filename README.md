# Listen Too 🎵

A web application that creates Spotify playlists from your most played tracks. Built with Next.js, TypeScript, and Tailwind CSS.

![Listen Too Screenshot](/screenshot.png)

## Features

- Create playlists from your top tracks
- Select different time ranges (short term, medium term, long term)
- Choose playlist length (10, 20, or 50 tracks)
- Generate shareable Spotify links
- Responsive design for desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Spotify OAuth
- **Icons**: Lucide React
- **Deployment**: [Your deployment platform]

## Getting Started

### Prerequisites

- Node.js 16+
- A Spotify Developer Account
- A registered Spotify Application

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=your_redirect_uri
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/listen-too.git
cd listen-too
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Access the application
2. Select the number of songs for your playlist
3. Choose your preferred time range
4. Authenticate with Spotify
5. Wait for playlist generation
6. Copy or share the playlist link

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built by Daniel Hilse
- Powered by [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## Contact

- Your Name - [LinkedIn](https://linkedin.com/in/yourusername)
- Project Link: [https://github.com/yourusername/listen-too](https://github.com/yourusername/listen-too)