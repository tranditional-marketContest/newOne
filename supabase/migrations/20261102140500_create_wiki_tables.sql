-- 신원위키: 가게 / 줄글 후기 / AI 요약 / 가격 제보
create type public.wiki_category as enum ('식당', '생활용품', '간식', '의류', '식자재', '기타');
create type public.price_source as enum ('prose', 'fields');

create table public.stores (
  id text primary key,
  name text not null,
  category public.wiki_category not null default '기타',
  hours text not null default '',
  items text not null default '',
  "character" text not null default '',
  discount text not null default '',
  note text not null default '',
  photos jsonb not null default '[]'::jsonb,
  updated_at date,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  text text not null default '',
  visited_date date not null,
  purchase_hour text,
  purchased_items text,
  created_at timestamptz not null default now()
);

create table public.review_summaries (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  category public.wiki_category,
  hours text not null default '',
  items text not null default '',
  "character" text not null default '',
  discount text not null default '',
  note text not null default '',
  menus jsonb not null default '[]'::jsonb,
  source text not null default 'gemini',
  created_at timestamptz not null default now()
);

create table public.menu_prices (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  menu_name text not null,
  amount integer not null check (amount > 0),
  grams integer,
  source public.price_source,
  visited_date date not null,
  review_id uuid references public.reviews(id) on delete set null,
  created_at timestamptz not null default now()
);

create index reviews_store_id_idx on public.reviews (store_id, visited_date desc);
create index menu_prices_store_id_idx on public.menu_prices (store_id, menu_name, visited_date desc);

alter table public.stores enable row level security;
alter table public.reviews enable row level security;
alter table public.review_summaries enable row level security;
alter table public.menu_prices enable row level security;

create policy "stores_select_anon" on public.stores for select to anon, authenticated using (true);
create policy "stores_insert_anon" on public.stores for insert to anon, authenticated with check (true);
create policy "stores_update_anon" on public.stores for update to anon, authenticated using (true) with check (true);

create policy "reviews_select_anon" on public.reviews for select to anon, authenticated using (true);
create policy "reviews_insert_anon" on public.reviews for insert to anon, authenticated with check (true);

create policy "summaries_select_anon" on public.review_summaries for select to anon, authenticated using (true);
create policy "summaries_insert_anon" on public.review_summaries for insert to anon, authenticated with check (true);

create policy "prices_select_anon" on public.menu_prices for select to anon, authenticated using (true);
create policy "prices_insert_anon" on public.menu_prices for insert to anon, authenticated with check (true);
