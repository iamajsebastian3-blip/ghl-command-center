-- GHL Command Center — Supabase schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses "create ... if not exists" or drops first where needed.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  company       text not null,
  industry      text,
  status        text not null default 'Active',          -- 'Active' | 'Onboarding' | 'Paused'
  engagement    text not null default 'Full-time',       -- 'Full-time' | 'Part-time' | 'Project-based'
  schedule      text,
  rate          integer,
  rate_label    text,
  joined_date   date,
  avatar        text,
  image         text,
  logo          text,
  brand_color   text,
  created_at    timestamptz not null default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  name        text not null,
  status      text not null default 'To Do',             -- 'To Do' | 'In Progress' | 'Done'
  priority    text not null default 'Medium',            -- 'Low' | 'Medium' | 'High' | 'Urgent'
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_client_id_idx on public.tasks(client_id);

create table if not exists public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author      text not null check (author in ('you', 'client')),
  body        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists task_comments_task_id_idx on public.task_comments(task_id);

create table if not exists public.comment_attachments (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid not null references public.task_comments(id) on delete cascade,
  type        text not null check (type in ('url', 'image')),
  url         text not null,
  label       text,
  filename    text,
  size        integer,
  mime_type   text,
  created_at  timestamptz not null default now()
);

create index if not exists comment_attachments_comment_id_idx on public.comment_attachments(comment_id);

-- One daily log per client (current state). Edited in place.
create table if not exists public.daily_logs (
  client_id         uuid primary key references public.clients(id) on delete cascade,
  log_date          date not null default current_date,
  time_in           text default '',
  time_out          text default '',
  tasks_completed   text[] not null default '{}',
  pending_tasks     text[] not null default '{}',
  priorities        text[] not null default '{}',
  blockers          text[] not null default '{}',
  next_day_plan     text[] not null default '{}',
  updated_at        timestamptz not null default now()
);

create table if not exists public.time_sessions (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  session_date  date not null,
  start_label   text not null,        -- e.g. "9:00 AM"
  end_label     text not null,
  start_epoch   bigint not null,
  end_epoch     bigint,
  seconds       integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists time_sessions_client_id_idx on public.time_sessions(client_id);
create index if not exists time_sessions_date_idx     on public.time_sessions(session_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security
--   anon (public client view URLs):  SELECT only.
--   service_role (server actions):    full access (bypasses RLS by default).
--   No INSERT/UPDATE/DELETE policies for anon — writes only via server actions
--   that verify the owner passcode cookie and use the service_role key.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.clients              enable row level security;
alter table public.tasks                enable row level security;
alter table public.task_comments        enable row level security;
alter table public.comment_attachments  enable row level security;
alter table public.daily_logs           enable row level security;
alter table public.time_sessions        enable row level security;

drop policy if exists "anon read clients"             on public.clients;
drop policy if exists "anon read tasks"               on public.tasks;
drop policy if exists "anon read task_comments"       on public.task_comments;
drop policy if exists "anon read comment_attachments" on public.comment_attachments;
drop policy if exists "anon read daily_logs"          on public.daily_logs;
drop policy if exists "anon read time_sessions"       on public.time_sessions;

create policy "anon read clients"             on public.clients              for select using (true);
create policy "anon read tasks"               on public.tasks                for select using (true);
create policy "anon read task_comments"       on public.task_comments        for select using (true);
create policy "anon read comment_attachments" on public.comment_attachments  for select using (true);
create policy "anon read daily_logs"          on public.daily_logs           for select using (true);
create policy "anon read time_sessions"       on public.time_sessions        for select using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime: broadcast row changes so the client view updates live
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'public.clients',
    'public.tasks',
    'public.task_comments',
    'public.comment_attachments',
    'public.daily_logs',
    'public.time_sessions'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and (schemaname || '.' || tablename) = t
    ) then
      execute format('alter publication supabase_realtime add table %s', t);
    end if;
  end loop;
end$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket for image attachments
--   Public read so clients can view inline; uploads via service_role only.
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true)
on conflict (id) do nothing;

drop policy if exists "public read task-attachments" on storage.objects;
create policy "public read task-attachments"
  on storage.objects for select
  using (bucket_id = 'task-attachments');
