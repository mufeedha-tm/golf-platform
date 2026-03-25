import { supabaseAdmin } from './supabase/admin';

export type LogLevel = 'info' | 'warning' | 'error';
export type LogEvent = 'payment' | 'draw' | 'error' | 'auth' | 'admin';

export async function logEvent(
  eventType: LogEvent,
  message: string,
  metadata: Record<string, unknown> = {},
  severity: LogLevel = 'info'
) {
  try {
    await supabaseAdmin.from('system_logs').insert({
      event_type: eventType,
      message,
      metadata,
      severity
    });
    const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${eventType.toUpperCase()}] ${message}`, metadata);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Logging Failed:', error.message);
  }
}
