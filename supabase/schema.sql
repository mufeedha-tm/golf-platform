
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  full_name           text,
  avatar_url          text,
  handicap_index      numeric(4,1) default 28.0,
  role                text not null default 'user', 

  stripe_customer_id  text unique,
  subscription_status text not null default 'inactive', 
  subscription_plan   text, 
  subscription_ends_at timestamptz,
  cancel_at_period_end boolean default false,
 
  chosen_charity_id   uuid,
  charity_pct         smallint default 10 check (charity_pct between 10 and 100),
 
  country_code        text default 'US',
  currency            text default 'USD',
  organization_id     uuid, 
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.scorecards (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  course_name     text not null,
  played_at       date not null default current_date,
  playing_handicap smallint not null,
  total_strokes   smallint,
  total_points    smallint,
  created_at      timestamptz not null default now(),
  constraint scorecards_total_points_draw_range check (total_points is null or (total_points between 1 and 45))
);

create or replace function public.enforce_latest_five_scorecards()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.scorecards s
  where s.id in (
    select sc.id
    from public.scorecards sc
    where sc.user_id = new.user_id
    order by sc.played_at desc, sc.created_at desc
    offset 5
  );
  return new;
end;
$$;

drop trigger if exists scorecards_keep_latest_five on public.scorecards;
create trigger scorecards_keep_latest_five
  after insert on public.scorecards
  for each row execute procedure public.enforce_latest_five_scorecards();

create table if not exists public.hole_scores (
  id            uuid primary key default gen_random_uuid(),
  scorecard_id  uuid not null references public.scorecards(id) on delete cascade,
  hole_number   smallint not null check (hole_number between 1 and 18),
  par           smallint not null,
  stroke_index  smallint not null,
  gross_strokes smallint,   
  stableford_pts smallint,
  unique (scorecard_id, hole_number)
);


create table if not exists public.charities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  logo_url    text,
  category    text default 'Community',
  region      text default 'UK',
  active      boolean not null default true,
  featured    boolean not null default false,
  images      text[],       
  events      jsonb,       
  created_at  timestamptz not null default now()
);


create table if not exists public.draws (
  id            uuid primary key default gen_random_uuid(),
  draw_date     date not null,
  scheduled_for timestamptz,
  status        text not null default 'pending', 
  winning_numbers int[],  
  metadata        jsonb,  
  winner_id     uuid references public.profiles(id),
  prize_desc    text,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists public.draw_entries (
  id        uuid primary key default gen_random_uuid(),
  draw_id   uuid not null references public.draws(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  tickets   smallint not null default 1,
  unique (draw_id, user_id)
);

create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id  text,
  status              text not null, 
  plan                text not null, 
  amount              numeric(12,2) not null,
  currency            text not null default 'usd',
  current_period_end  timestamptz,
  cancel_at_period_end boolean default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


create table if not exists public.charity_donations (
  id            uuid primary key default gen_random_uuid(),
  charity_id    uuid not null references public.charities(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  amount        numeric(12,2) not null,
  source_type   text not null, 
  draw_id       uuid references public.draws(id),
  created_at    timestamptz not null default now()
);


create table if not exists public.draw_results (
  id                uuid primary key default gen_random_uuid(),
  draw_id           uuid not null references public.draws(id) on delete cascade,
  winning_numbers   int[] not null,
  total_pool        numeric(12,2) not null,
  rollover_amount   numeric(12,2) default 0,
  prize_per_user    jsonb,
  match_5_winners   int default 0,
  match_4_winners   int default 0,
  match_3_winners   int default 0,
  charity_total     numeric(12,2) not null,
  jackpot_rollover  numeric(12,2) default 0,
  published_at      timestamptz not null default now()
);

create table if not exists public.jackpot_pool (
  id            boolean primary key default true,
  current_amount numeric(12,2) not null default 0,
  last_updated  timestamptz not null default now()
);

alter table public.profiles      enable row level security;
alter table public.scorecards    enable row level security;
alter table public.hole_scores   enable row level security;
alter table public.charities     enable row level security;
alter table public.draws         enable row level security;
alter table public.draw_entries  enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.charity_donations enable row level security;
alter table public.draw_results      enable row level security;
alter table public.jackpot_pool      enable row level security;


drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"     on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"   on public.profiles for update using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"   on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


drop policy if exists "Users own scorecards" on public.scorecards;
create policy "Users own scorecards"  on public.scorecards for all using (auth.uid() = user_id);

drop policy if exists "Users own hole scores" on public.hole_scores;
create policy "Users own hole scores" on public.hole_scores for all using (
  exists (select 1 from public.scorecards where id = scorecard_id and user_id = auth.uid())
);


drop policy if exists "Anyone can view charities" on public.charities;
create policy "Anyone can view charities" on public.charities for select using (true);


drop policy if exists "Subscribers see draws" on public.draws;
create policy "Subscribers see draws"     on public.draws for select using (
  exists (select 1 from public.profiles where id = auth.uid() and subscription_status = 'active')
);


drop policy if exists "Users view own subscriptions" on public.subscriptions;
create policy "Users view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "Users view own donations" on public.charity_donations;
create policy "Users view own donations" on public.charity_donations for select using (auth.uid() = user_id);

drop policy if exists "Anyone view draw results" on public.draw_results;
create policy "Anyone view draw results" on public.draw_results for select using (true);

drop policy if exists "Anyone view jackpot pool" on public.jackpot_pool;
create policy "Anyone view jackpot pool" on public.jackpot_pool for select using (true);


create table if not exists public.system_settings (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);


create table if not exists public.payouts (
  id            uuid primary key default gen_random_uuid(),
  draw_id       uuid not null references public.draws(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount        numeric(12,2) not null,
  tier          smallint not null check (tier in (3, 4, 5)),
  proof_url     text,
  proof_storage_path text,
  status        text not null default 'pending',
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.payouts enable row level security;
drop policy if exists "Users see own payouts" on public.payouts;
create policy "Users see own payouts" on public.payouts for select using (auth.uid() = user_id);


drop policy if exists "Admins manage all" on public.payouts;
create policy "Admins manage all" on public.payouts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins manage settings" on public.system_settings;
create policy "Admins manage settings" on public.system_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins manage jackpot pool" on public.jackpot_pool;
create policy "Admins manage jackpot pool" on public.jackpot_pool for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  tier        text not null default 'free', 
  max_seats   int default 5,
  branding    jsonb, 
  created_at  timestamptz not null default now()
);


create table if not exists public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  charity_id      uuid not null references public.charities(id) on delete cascade,
  name            text not null,
  description     text,
  banner_url      text,
  start_date      timestamptz not null,
  end_date        timestamptz not null,
  target_amount   numeric(12,2),
  current_amount  numeric(12,2) default 0,
  active          boolean default true,
  metadata        jsonb not null default '{}'::jsonb,
  external_ref    text,
  created_at      timestamptz not null default now()
);


alter table public.organizations enable row level security;
alter table public.campaigns     enable row level security;

drop policy if exists "Organizations visible to members" on public.organizations;
create policy "Organizations visible to members" on public.organizations for select using (
  exists (select 1 from public.profiles where organization_id = id and id = auth.uid())
);

drop policy if exists "Campaigns visible to all" on public.campaigns;
create policy "Campaigns visible to all" on public.campaigns for select using (true);

drop policy if exists "Admins manage scalability" on public.organizations;
create policy "Admins manage scalability" on public.organizations for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins manage campaigns" on public.campaigns;
create policy "Admins manage campaigns" on public.campaigns for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

insert into storage.buckets (id, name, public) 
values ('winner-proofs', 'winner-proofs', false)
on conflict do nothing;

drop policy if exists "Users can upload own proofs" on storage.objects;
create policy "Users can upload own proofs"
on storage.objects for insert
with check (
  bucket_id = 'winner-proofs' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can view own proofs" on storage.objects;
create policy "Users can view own proofs"
on storage.objects for select
using (
  bucket_id = 'winner-proofs' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins can manage all proofs" on storage.objects;
create policy "Admins can manage all proofs"
on storage.objects for all
using (
  bucket_id = 'winner-proofs' AND 
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);


create table if not exists public.system_logs (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null,
  message     text not null,
  metadata    jsonb,
  severity    text default 'info',
  created_at  timestamptz not null default now()
);

alter table public.system_logs enable row level security;
drop policy if exists "Admins see all logs" on public.system_logs;
create policy "Admins see all logs" on public.system_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

insert into public.charities (name, description, logo_url, category, region, featured)
values 
  ('Junior Golf Foundation', 'Empowering the next generation of golfers through equipment grants and professional coaching.', 'https://api.dicebear.com/7.x/initials/svg?seed=JGF', 'Education', 'UK', true),
  ('Greens for Good', 'Environmental conservation dedicated to maintaining sustainable water usage in golf courses worldwide.', 'https://api.dicebear.com/7.x/initials/svg?seed=GFG', 'Environment', 'UK', false),
  ('Caddy Scholars', 'Providing higher education scholarships for career caddies and their families.', 'https://api.dicebear.com/7.x/initials/svg?seed=CS', 'Education', 'US', true),
  ('Wounded Warriors Golf', 'Using the therapeutic power of golf to support veterans in their physical and mental recovery.', 'https://api.dicebear.com/7.x/initials/svg?seed=WWG', 'Health', 'US', false),
  ('Urban Youth Links', 'Bringing golf to inner-city communities to foster discipline, focus, and mentorship.', 'https://api.dicebear.com/7.x/initials/svg?seed=UYL', 'Community', 'UK', true)
on conflict do nothing;

insert into public.system_settings (key, value)
values 
  ('current_prize_pool', '1500.00'),
  ('jackpot_rollover', '500.00'),
  ('subscription_price', '30.00'),
  ('pool_percentage', '0.65')
on conflict (key) do update set value = excluded.value;

insert into public.jackpot_pool (id, current_amount)
values (true, 500.00)
on conflict (id) do nothing;

alter table public.charities add column if not exists category text default 'Community';
alter table public.charities add column if not exists region text default 'UK';
alter table public.draws add column if not exists scheduled_for timestamptz;
update public.draws set scheduled_for = coalesce(scheduled_for, draw_date::timestamptz) where scheduled_for is null;
alter table public.campaigns add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.campaigns add column if not exists external_ref text;
alter table public.payouts add column if not exists proof_storage_path text;
alter table public.payouts add column if not exists payment_status text default 'pending';
alter table public.scorecards drop constraint if exists scorecards_total_points_draw_range;
alter table public.scorecards add constraint scorecards_total_points_draw_range check (total_points is null or (total_points between 1 and 45));

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  return new;
end;
$$;

create or replace function public.sync_user_email_to_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_user_email_to_profile();

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
