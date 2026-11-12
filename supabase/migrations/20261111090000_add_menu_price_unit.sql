-- 메뉴 가격 단위: 100g / 개·한알 / 팩 / 기타
-- (원격 DB에는 이미 적용됐을 수 있음 — 로컬 스키마 추적용)
alter table public.menu_prices
  add column if not exists unit text;

update public.menu_prices
set unit = case
  when menu_name ~* '100\s*g$' then 'per_100g'
  when menu_name ~ '(한\s*알|개당|/개|[0-9]+\s*개|쪽)' then 'per_piece'
  when menu_name ~ '(팩|봉지|망)' then 'per_pack'
  else 'each'
end
where unit is null;

update public.menu_prices
set menu_name = trim(regexp_replace(menu_name, '\s*100\s*g$', '', 'i'))
where menu_name ~* '100\s*g$';

alter table public.menu_prices
  alter column unit set default 'per_100g';

update public.menu_prices set unit = 'per_100g' where unit is null;

alter table public.menu_prices
  alter column unit set not null;

alter table public.menu_prices
  drop constraint if exists menu_prices_unit_check;

alter table public.menu_prices
  add constraint menu_prices_unit_check
  check (unit in ('per_100g', 'per_piece', 'per_pack', 'each'));

create index if not exists menu_prices_store_unit_idx
  on public.menu_prices (store_id, menu_name, unit, visited_date desc);
