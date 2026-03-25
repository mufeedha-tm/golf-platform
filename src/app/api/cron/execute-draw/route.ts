import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import * as DrawService from '@/lib/services/draw-service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { data: activeDraw, error: fetchError } = await supabaseAdmin
      .from('draws')
      .select('id')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !activeDraw) {
      return NextResponse.json({ success: true, message: 'No pending draw found' });
    }
    const result = await DrawService.runAndPublishDraw(supabaseAdmin, activeDraw.id, 'random');

    return NextResponse.json({
      success: true,
      message: 'Draw executed successfully',
      drawId: activeDraw.id,
      winnersCount:
        result.winners.match5.length + result.winners.match4.length + result.winners.match3.length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('CRON EXECUTION ERROR:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
