import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireSubscription() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single();

  const isActive =
    profile?.subscription_status === 'active' ||
    profile?.role === 'admin';

  if (!isActive) {
    redirect('/pricing?error=subscription_required');
  }

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireSubscription();

  if (profile?.role !== 'admin') {
    redirect('/dashboard?error=unauthorized');
  }

  return { user, profile };
}
