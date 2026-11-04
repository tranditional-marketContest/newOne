-- Supabase SQL Editor에서 실행하세요.
-- 매니저 지도 등록용 점포 테이블 (+ 위치 map_x, map_y)

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (
    category in ('식당', '생활용품', '간식', '의류', '식자재', '기타')
  ),
  map_x double precision not null,
  map_y double precision not null,
  created_at timestamptz not null default now()
);

-- 이미 stores 테이블이 있고 위치 컬럼만 없을 때
alter table public.stores
  add column if not exists map_x double precision,
  add column if not exists map_y double precision;

alter table public.stores enable row level security;

drop policy if exists "stores_select_public" on public.stores;
drop policy if exists "stores_insert_public" on public.stores;
drop policy if exists "stores_delete_public" on public.stores;

-- 팀 브랜치들이 같이 읽도록 공개 조회 허용
create policy "stores_select_public"
  on public.stores for select
  to anon, authenticated
  using (true);

-- 매니저 페이지(클라이언트)에서 등록/삭제
create policy "stores_insert_public"
  on public.stores for insert
  to anon, authenticated
  with check (true);

create policy "stores_delete_public"
  on public.stores for delete
  to anon, authenticated
  using (true);

-- 예시 시드 (없을 때만)
insert into public.stores (name, category, map_x, map_y)
select * from (
  values
    ('영광과일', '식자재', 38::float8, 42::float8),
    ('과일나라', '식자재', 52::float8, 48::float8)
) as v(name, category, map_x, map_y)
where not exists (select 1 from public.stores limit 1);
