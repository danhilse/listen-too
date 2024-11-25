import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Listen Too | Spotify Playlist Generator',
  description: 'Create playlists from your top songs',
  openGraph: {
    images: [{
      url: '/og-image.png', // or absolute URL
      width: 1200,
      height: 630,
    }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}