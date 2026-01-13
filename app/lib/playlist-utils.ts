import { Track } from './types';

export function interweaveAndDeduplicate(
  topTracks: Track[],
  likedTracks: Track[],
  targetCount: number
): Track[] {
  const seenIds = new Set<string>();
  const result: Track[] = [];

  let topIndex = 0;
  let likedIndex = 0;
  let useTop = true;

  while (result.length < targetCount) {
    // Check if we've exhausted both sources
    if (topIndex >= topTracks.length && likedIndex >= likedTracks.length) {
      break;
    }

    let trackAdded = false;

    if (useTop) {
      // Try to add from top tracks, skip duplicates
      while (topIndex < topTracks.length && !trackAdded) {
        const candidate = topTracks[topIndex];
        topIndex++;
        if (!seenIds.has(candidate.id)) {
          seenIds.add(candidate.id);
          result.push(candidate);
          trackAdded = true;
        }
      }
    } else {
      // Try to add from liked tracks, skip duplicates
      while (likedIndex < likedTracks.length && !trackAdded) {
        const candidate = likedTracks[likedIndex];
        likedIndex++;
        if (!seenIds.has(candidate.id)) {
          seenIds.add(candidate.id);
          result.push(candidate);
          trackAdded = true;
        }
      }
    }

    // If we couldn't add from the current source, try the other
    if (!trackAdded) {
      if (useTop && likedIndex < likedTracks.length) {
        while (likedIndex < likedTracks.length && !trackAdded) {
          const candidate = likedTracks[likedIndex];
          likedIndex++;
          if (!seenIds.has(candidate.id)) {
            seenIds.add(candidate.id);
            result.push(candidate);
            trackAdded = true;
          }
        }
      } else if (!useTop && topIndex < topTracks.length) {
        while (topIndex < topTracks.length && !trackAdded) {
          const candidate = topTracks[topIndex];
          topIndex++;
          if (!seenIds.has(candidate.id)) {
            seenIds.add(candidate.id);
            result.push(candidate);
            trackAdded = true;
          }
        }
      }
    }

    // Alternate between sources
    useTop = !useTop;
  }

  return result;
}
