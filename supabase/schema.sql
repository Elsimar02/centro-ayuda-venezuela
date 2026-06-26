-- Centro de Coordinación Ciudadana — esquema de reportes de incidentes
-- Ejecutar en el SQL Editor de Supabase (Project > SQL Editor > New query)

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'atrapada','colapso','bloqueo','peligro','ayuda','hospital',
    'refugio','agua','alimentos','medicinas','electricidad','internet'
  )),
  lat double precision not null,
  lng double precision not null,
  place text not null,
  description text not null default '',
  urgency text not null check (urgency in ('critica','alta','media','baja')),
  status text not null default 'sin_verificar' check (status in (
    'sin_verificar','verificado','en_proceso','resuelto','falso'
  )),
  people integer not null default 0,
  confidence integer not null default 20 check (confidence between 0 and 100),
  vc_confirm integer not null default 0,
  vc_attended integer not null default 0,
  vc_incorrect integer not null default 0,
  reporter_name text not null default 'Anónimo',
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_type_idx on public.reports (type);

alter table public.reports enable row level security;

-- Cualquiera puede leer los reportes (es una app pública de respuesta a emergencias)
create policy "reports_select_all" on public.reports
  for select using (true);

-- Cualquiera puede crear un reporte nuevo (reporte ciudadano sin login)
create policy "reports_insert_all" on public.reports
  for insert with check (true);

-- Cualquiera puede actualizar (verificación comunitaria + moderación)
-- NOTA: esto es deliberadamente abierto para el MVP. Si más adelante agregan
-- login de moderadores, hay que restringir este UPDATE a esa tabla de roles.
create policy "reports_update_all" on public.reports
  for update using (true);

-- Habilitar realtime (para que el mapa se actualice solo entre los usuarios conectados)
alter publication supabase_realtime add table public.reports;
