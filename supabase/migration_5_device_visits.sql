-- Contador silencioso de dispositivos únicos que visitan la página.
-- No tiene UI: el cliente genera un id aleatorio por dispositivo (localStorage)
-- y lo inserta una sola vez. Nadie puede leer el conteo desde el navegador
-- (no hay policy de select para anon) — solo accesible vía dashboard de
-- Supabase o pidiéndole a Claude que lo consulte con la service-role key.

create table if not exists public.device_visits (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  first_seen_at timestamptz not null default now()
);

alter table public.device_visits enable row level security;

drop policy if exists "device_visits_insert_anon" on public.device_visits;
create policy "device_visits_insert_anon" on public.device_visits
  for insert with check (true);

-- Intencional: sin policy de select para el rol anon/authenticated.
-- Solo la service-role key (bypassa RLS) puede contar filas.
