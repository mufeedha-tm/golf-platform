import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DrawMode } from '@/lib/draw-engine';
import * as DrawService from '@/lib/services/draw-service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = (body?.mode as DrawMode) || 'random';
    const allowedModes: DrawMode[] = ['random', 'algorithmic_most', 'algorithmic_least'];
    const safeMode = allowedModes.includes(mode) ? mode : 'random';

    const userEntries = await DrawService.getDrawData(supabase);
    const { totalPool, currentRollover } = await DrawService.calculatePoolInfo(supabase);
    const { executeDraw } = await import('@/lib/draw-engine');
    const result = executeDraw(userEntries, safeMode, totalPool, currentRollover);

    const idToEmail = Object.fromEntries(userEntries.map((e) => [e.userId, e.email])) as Record<string, string>;
    const winnerDetails = {
      match5: result.winners.match5.map((id) => idToEmail[id]),
      match4: result.winners.match4.map((id) => idToEmail[id]),
      match3: result.winners.match3.map((id) => idToEmail[id]),
    };

    return NextResponse.json({
      success: true,
      ...result,
      winnerDetails,
      simulated: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Simulation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
