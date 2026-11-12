-- 반띵 매칭 게시글과 1대1 채팅.
-- 로그인은 Firebase라 Supabase auth.uid()로 작성자를 가릴 수 없다.
-- 신원위키와 같이 anon 키로 읽고 쓰며, 작성자 구분은 author_id(Firebase uid)로 한다.

create table if not exists public.matching_posts (
  id text primary key,
  category text not null,
  item_name text not null,
  store_name text not null default '',
  menu_name text not null default '',
  total_price integer not null check (total_price > 0),
  people_needed integer not null check (people_needed >= 2),
  people_joined integer not null default 1 check (people_joined >= 1),
  deadline_minutes integer not null check (deadline_minutes > 0),
  meeting_place text not null,
  custom_place text,
  note text,
  author_id text not null,
  author_name text not null,
  status text not null default 'open',
  image_emoji text not null default '🛒',
  participant_ids jsonb not null default '[]'::jsonb,
  matched_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.matching_messages (
  id text primary key,
  post_id text not null references public.matching_posts(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists matching_posts_created_at_idx
  on public.matching_posts (created_at desc);
create index if not exists matching_messages_post_id_idx
  on public.matching_messages (post_id, created_at);

alter table public.matching_posts enable row level security;
alter table public.matching_messages enable row level security;

grant select, insert, update, delete on public.matching_posts to anon, authenticated;
grant select, insert, update, delete on public.matching_messages to anon, authenticated;

drop policy if exists "matching_posts_select" on public.matching_posts;
drop policy if exists "matching_posts_insert" on public.matching_posts;
drop policy if exists "matching_posts_update" on public.matching_posts;
drop policy if exists "matching_posts_delete" on public.matching_posts;
drop policy if exists "matching_messages_select" on public.matching_messages;
drop policy if exists "matching_messages_insert" on public.matching_messages;
drop policy if exists "matching_messages_delete" on public.matching_messages;

create policy "matching_posts_select" on public.matching_posts
  for select to anon, authenticated using (true);
create policy "matching_posts_insert" on public.matching_posts
  for insert to anon, authenticated with check (true);
create policy "matching_posts_update" on public.matching_posts
  for update to anon, authenticated using (true) with check (true);
create policy "matching_posts_delete" on public.matching_posts
  for delete to anon, authenticated using (true);

create policy "matching_messages_select" on public.matching_messages
  for select to anon, authenticated using (true);
create policy "matching_messages_insert" on public.matching_messages
  for insert to anon, authenticated with check (true);
create policy "matching_messages_delete" on public.matching_messages
  for delete to anon, authenticated using (true);

do $$
begin
  alter publication supabase_realtime add table public.matching_posts;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.matching_messages;
exception
  when duplicate_object then null;
end $$;
