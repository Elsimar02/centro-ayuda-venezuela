-- Marketplace Solidario: directorio de colaboradores (personas, empresas, ONG,
-- iglesias, voluntarios, refugios, centros de acopio, instituciones) que se
-- registran y declaran QUÉ OFRECEN y QUÉ NECESITAN durante el desastre, para
-- que cualquiera pueda verlos en catálogo + mapa y contactarlos.
--
-- Ejecutar en el SQL Editor de Supabase (Project > SQL Editor > New query).

create table if not exists public.aid_providers (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'persona','empresa','ong','iglesia','voluntario',
    'refugio','centro_acopio','institucion'
  )),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  lat double precision not null,
  lng double precision not null,
  place text not null default '',
  -- Radio máximo (km) hasta donde el colaborador puede llevar/entregar ayuda.
  radius_km integer not null default 0,
  -- Claves de recursos (ver RESOURCES en src/lib/marketplace.ts), p.ej. {'agua','colchones'}.
  offers text[] not null default '{}',
  needs  text[] not null default '{}',
  quantity text not null default '',     -- cantidad disponible (texto libre)
  availability text not null default 'inmediata' check (availability in ('inmediata','programada')),
  available_from date,                   -- si availability = 'programada'
  schedule text not null default '',     -- horario de atención / entrega
  notes text not null default '',
  status text not null default 'activo' check (status in ('activo','pausado','cerrado')),
  created_at timestamptz not null default now()
);

create index if not exists aid_providers_created_at_idx on public.aid_providers (created_at desc);
create index if not exists aid_providers_kind_idx on public.aid_providers (kind);
create index if not exists aid_providers_status_idx on public.aid_providers (status);
-- GIN para filtrar rápido por recurso ofrecido/necesitado (offers @> '{agua}').
create index if not exists aid_providers_offers_idx on public.aid_providers using gin (offers);
create index if not exists aid_providers_needs_idx  on public.aid_providers using gin (needs);

alter table public.aid_providers enable row level security;

-- App pública de respuesta a emergencias: cualquiera puede ver el directorio.
drop policy if exists "aid_providers_select_all" on public.aid_providers;
create policy "aid_providers_select_all" on public.aid_providers
  for select using (true);

-- Cualquiera puede registrarse como colaborador (sin login).
drop policy if exists "aid_providers_insert_all" on public.aid_providers;
create policy "aid_providers_insert_all" on public.aid_providers
  for insert with check (true);

-- Update abierto para el MVP (un colaborador marca su estado activo/pausado/cerrado,
-- igual que la moderación abierta de reports). Restringir cuando haya login.
drop policy if exists "aid_providers_update_all" on public.aid_providers;
create policy "aid_providers_update_all" on public.aid_providers
  for update using (true);

-- Realtime: el catálogo y el mapa se actualizan solos entre usuarios conectados.
alter publication supabase_realtime add table public.aid_providers;
