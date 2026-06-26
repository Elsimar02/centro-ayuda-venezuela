-- Actualizaciones en vivo por reporte (verificación y seguimiento ciudadano).
-- Caso crítico: alguien reporta una persona desaparecida, otra persona la
-- localiza y deja aquí la novedad + un teléfono opcional para que la familia
-- lo contacte. Ejecutar en el SQL Editor de Supabase.

create table if not exists public.report_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  kind text not null check (kind in (
    'confirmacion','en_camino','trabajando','localizada','resuelto','info'
  )),
  message text not null default '',
  author_name text not null default 'Anónimo',
  author_phone text,
  created_at timestamptz not null default now()
);

create index if not exists report_updates_report_id_idx
  on public.report_updates (report_id, created_at desc);

alter table public.report_updates enable row level security;

-- App pública de emergencia: cualquiera puede leer y aportar una actualización.
create policy "report_updates_select_all" on public.report_updates
  for select using (true);

create policy "report_updates_insert_all" on public.report_updates
  for insert with check (true);

-- Realtime: que las actualizaciones aparezcan en vivo para todos los conectados.
alter publication supabase_realtime add table public.report_updates;
