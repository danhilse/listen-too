// src/components/PlaylistCreator.tsx
import { Button } from "@/components/ui/button"
import { Track } from '@/types/spotify';

interface Props {
  likedSongs: Track[];
  topSongs: Track[];
  onPlaylistCreated: () => Promise<void>;
  isCreating: boolean;
}

export default function PlaylistCreator({
  likedSongs,
  topSongs,
  onPlaylistCreated,
  isCreating
}: Props) {
  return (
    <div className="text-center">
      <Button
        onClick={onPlaylistCreated}
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold"
        disabled={likedSongs.length === 0 || topSongs.length === 0 || isCreating}
      >
        {isCreating ? "Creating Playlist..." : "Create Playlist"}
      </Button>
    </div>
  );
}