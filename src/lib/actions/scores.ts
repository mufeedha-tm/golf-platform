'use server'

import { revalidatePath } from 'next/cache'

import { requireSubscription } from '@/lib/auth-guards'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_HOLES, stablefordPoints } from '@/lib/stableford'

export type SaveScorecardInput = {
  courseName: string
  playedAt: string
  playingHandicap: number
  strokes: Record<number, number>
}

export async function saveScorecard(data: SaveScorecardInput) {
  const { user } = await requireSubscription()
  const supabase = await createClient()

  if (!data.courseName?.trim()) {
    throw new Error('Course name is required')
  }

  const totalPoints = DEFAULT_HOLES.reduce((acc, hole) => {
    const gross = data.strokes[hole.number] ?? 0
    return acc + stablefordPoints(gross, hole.par, hole.strokeIndex, data.playingHandicap)
  }, 0)

  if (totalPoints < 1 || totalPoints > 45) {
    throw new Error('Round total Stableford points must be between 1 and 45 for this draw system')
  }

  const totalStrokes = Object.values(data.strokes).reduce((a, b) => a + (b > 0 ? b : 0), 0)

  const { data: card, error: cardError } = await supabase
    .from('scorecards')
    .insert({
      user_id: user.id,
      course_name: data.courseName.trim(),
      played_at: data.playedAt,
      playing_handicap: data.playingHandicap,
      total_strokes: totalStrokes || null,
      total_points: totalPoints,
    })
    .select('id')
    .single()

  if (cardError || !card) throw new Error(cardError?.message ?? 'Failed to save scorecard')

  const holeRows = DEFAULT_HOLES.map((hole) => {
    const gross = data.strokes[hole.number] ?? 0
    if (gross <= 0) return null
    const pts = stablefordPoints(gross, hole.par, hole.strokeIndex, data.playingHandicap)
    return {
      scorecard_id: card.id,
      hole_number: hole.number,
      par: hole.par,
      stroke_index: hole.strokeIndex,
      gross_strokes: gross,
      stableford_pts: pts,
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  if (holeRows.length > 0) {
    const { error: holeError } = await supabase.from('hole_scores').insert(holeRows)
    if (holeError) throw new Error(holeError.message)
  }

  revalidatePath('/dashboard/scores')
}
