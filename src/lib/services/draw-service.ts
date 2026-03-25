import { SupabaseClient } from '@supabase/supabase-js';
import { executeDraw, type DrawMode, type ScoreEntry } from '@/lib/draw-engine';
import { sendEmail } from '@/lib/email';
import { calculateTotalPool } from '@/lib/services/prize-service';

export async function getDrawData(supabase: SupabaseClient): Promise<(ScoreEntry & { email: string })[]> {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('subscription_status', 'active');

  if (!profiles) return [];

  const userIds = profiles.map(p => p.id);

  const { data: allScores } = await supabase
    .from('scorecards')
    .select('user_id, total_points, played_at, created_at')
    .in('user_id', userIds)
    .order('played_at', { ascending: false })
    .order('created_at', { ascending: false });

  const entriesMap: Record<string, { points: number[], email: string }> = {};
  
  profiles.forEach(p => {
    entriesMap[p.id] = { points: [], email: p.email };
  });

  const sortedScores = [...(allScores ?? [])].sort((a, b) => {
    const da = String(a.played_at ?? '');
    const db = String(b.played_at ?? '');
    if (da !== db) return db.localeCompare(da);
    const ca = String(a.created_at ?? '');
    const cb = String(b.created_at ?? '');
    return cb.localeCompare(ca);
  });
  sortedScores.forEach((s) => {
    if (s.total_points == null) return;
    if (entriesMap[s.user_id].points.length < 5) {
      entriesMap[s.user_id].points.push(s.total_points);
    }
  });

  return Object.entries(entriesMap).map(([userId, data]) => ({ 
    userId, 
    points: data.points,
    email: data.email
  }));
}

export async function calculatePoolInfo(supabase: SupabaseClient) {
  const { count: activeSubscribers, error: subsCountError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active');

  if (subsCountError) throw new Error(subsCountError.message);

  const { data: priceSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'subscription_price')
    .single();

  const { data: poolPctSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'pool_percentage')
    .single();

  const { data: poolSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'current_prize_pool')
    .single();

  const { data: rolloverConfig } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'jackpot_rollover')
    .single();

  const fundedPool = Number(poolSetting?.value) || 0;
  const currentRollover = Number(rolloverConfig?.value) || 0;
  const subscriptionPrice = Number(priceSetting?.value) || 0;
  const poolPercentage = Number(poolPctSetting?.value) || 0.65;
  const modeledPool = calculateTotalPool({
    totalActiveSubscribers: activeSubscribers ?? 0,
    subscriptionPrice,
    poolPercentage,
  });
  const totalPool = fundedPool > 0 ? fundedPool : modeledPool;

  return {
    totalPool,
    currentRollover,
    totalActiveSubscribers: activeSubscribers ?? 0,
    subscriptionPrice,
    poolPercentage
  };
}

export async function runAndPublishDraw(
  supabase: SupabaseClient,
  drawId: string,
  mode: DrawMode,
  options?: { force?: boolean }
) {
  const { logEvent } = await import('@/lib/logger');
  
  await logEvent('draw', `Attempting to execute draw: ${drawId}`, { mode });

  const { data: drawRow, error: drawFetchError } = await supabase
    .from('draws')
    .select('id, status, scheduled_for, draw_date')
    .eq('id', drawId)
    .single();

  if (drawFetchError || !drawRow) {
    throw new Error(drawFetchError?.message ?? 'Draw not found');
  }
  if (drawRow.status !== 'pending') {
    throw new Error('Draw is not pending and cannot be executed');
  }
  const when = drawRow.scheduled_for
    ? new Date(drawRow.scheduled_for)
    : new Date(`${drawRow.draw_date}T00:00:00.000Z`);
  if (
    !options?.force &&
    Number.isFinite(when.getTime()) &&
    when.getTime() > Date.now()
  ) {
    throw new Error('Scheduled draw time has not been reached yet');
  }

  const userEntries = await getDrawData(supabase);
  const { totalPool, currentRollover, totalActiveSubscribers, subscriptionPrice, poolPercentage } = await calculatePoolInfo(supabase);
  
  const result = executeDraw(userEntries, mode, totalPool, currentRollover);

  const { error } = await supabase
    .from('draws')
    .update({ 
      status: 'completed',
      winning_numbers: result.winningNumbers,
      metadata: { 
        winners: result.winners, 
        prizes: result.prizes,
        pool_calc: { totalPool, currentRollover, totalActiveSubscribers, subscriptionPrice, poolPercentage },
        prize_per_user: result.prizePerUser
      }, 
      published_at: new Date().toISOString()
    })
    .eq('id', drawId);

  if (error) throw new Error(error.message);

  await supabase
    .from('system_settings')
    .upsert([
      { 
        key: 'jackpot_rollover', 
        value: JSON.stringify(result.rolloverAmount),
        updated_at: new Date().toISOString()
      },
      {
        key: 'current_prize_pool',
        value: '0',
        updated_at: new Date().toISOString()
      }
    ]);

  await supabase
    .from('jackpot_pool')
    .upsert({
      id: true,
      current_amount: result.rolloverAmount,
      last_updated: new Date().toISOString(),
    });

  await supabase
    .from('draw_results')
    .insert({
      draw_id: drawId,
      winning_numbers: result.winningNumbers,
      total_pool: totalPool,
      match_5_winners: result.winners.match5.length,
      match_4_winners: result.winners.match4.length,
      match_3_winners: result.winners.match3.length,
      charity_total: 0,
      jackpot_rollover: result.rolloverAmount,
      rollover_amount: result.rolloverAmount,
      prize_per_user: result.prizePerUser,
    });

  const winnerEmails = [
    ...result.winners.match5,
    ...result.winners.match4,
    ...result.winners.match3
  ];

  for (const entry of userEntries as (ScoreEntry & { email: string })[]) {
    const isWinner = winnerEmails.includes(entry.userId);
    
    await sendEmail({
      to: entry.email,
      subject: isWinner ? "You Won! 🏆 Golf SaaS Results" : "Draw Results are In! ⛳️",
      html: isWinner 
        ? `<h1>Congratulations!</h1><p>You matched numbers in this month's draw. Check your dashboard for payout details!</p>`
        : `<h1>Results Updated</h1><p>The monthly draw is complete. Better luck next time! Winning numbers: ${result.winningNumbers.join(', ')}</p>`
    });
  }

  return result;
}
