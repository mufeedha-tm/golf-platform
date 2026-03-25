

export interface Hole {
  number: number
  par: number
  strokeIndex: number
}

export interface HoleScore {
  hole: Hole
  strokes: number 
}

export function extraStrokesOnHole(playingHandicap: number, strokeIndex: number): number {
  if (playingHandicap <= 0) return 0
  if (playingHandicap >= strokeIndex) {
    const base = 1
    const second = playingHandicap - 18 >= strokeIndex ? 1 : 0
    return base + second
  }
  return 0
}

export function stablefordPoints(
  grossStrokes: number,
  par: number,
  strokeIndex: number,
  playingHandicap: number
): number {
  if (grossStrokes <= 0) return 0 

  const extra = extraStrokesOnHole(playingHandicap, strokeIndex)
  const netStrokes = grossStrokes - extra
  const diff = par - netStrokes 

  const points = 2 + diff 
  return Math.max(0, points)
}

export function totalStablefordPoints(
  scores: HoleScore[],
  playingHandicap: number
): number {
  return scores.reduce((total, { hole, strokes }) => {
    return total + stablefordPoints(strokes, hole.par, hole.strokeIndex, playingHandicap)
  }, 0)
}

export const DEFAULT_HOLES: Hole[] = Array.from({ length: 18 }, (_, i) => ({
  number: i + 1,
  par: [4, 4, 3, 4, 5, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4][i],
  strokeIndex: i + 1,
}))
