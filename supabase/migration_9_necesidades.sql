-- Módulo "Necesidades Humanitarias": registro estructurado de lo que necesita
-- una familia/comunidad para sobrevivir, distinto del modelo de `reports`
-- (incidentes puntuales). Ejecutar en el SQL Editor de Supabase.

create sequence if not exists necesidades_case_seq;

create table if not exists public.necesidades (
  id uuid primary key default gen_random_uuid(),
  case_number text not null default (
    'NH-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('necesidades_case_seq')::text, 5, '0')
  ),

  contact_name text not null,
  contact_phone text not null,
  contact_whatsapp text,
  contact_email text,

  estado text not null,
  municipio text,
  parroquia text,
  direccion text,
  referencia text,
  lat double precision,
  lng double precision,

  people_total int not null default 1,
  people_children int not null default 0,
  people_elderly int not null default 0,
  people_pregnant int not null default 0,
  people_disabled int not null default 0,
  people_pets int not null default 0,

  emergency_types text[] not null default '{}',
  emergency_other text,
  needs text[] not null default '{}',
  needs_other text,

  urgency text not null check (urgency in ('critica', 'alta', 'media', 'baja')),
  description text not null default '',

  -- [{ kind: 'foto' | 'documento', url, name? }]
  media jsonb not null default '[]'::jsonb,

  status text not null default 'sin_verificar' check (status in (
    'sin_verificar', 'en_proceso', 'resuelto', 'falso'
  )),

  created_at timestamptz not null default now()
);

create unique index if not exists necesidades_case_number_idx on public.necesidades (case_number);
create index if not exists necesidades_created_at_idx on public.necesidades (created_at desc);
create index if not exists necesidades_status_idx on public.necesidades (status);
create index if not exists necesidades_urgency_idx on public.necesidades (urgency);
create index if not exists necesidades_needs_idx on public.necesidades using gin (needs);
create index if not exists necesidades_emergency_types_idx on public.necesidades using gin (emergency_types);

alter table public.necesidades enable row level security;

-- App pública sin login todavía: igual que `reports`, abierto para insert/select.
-- update también abierto para que el panel admin pueda cambiar `status` sin auth.
drop policy if exists "necesidades_select_all" on public.necesidades;
create policy "necesidades_select_all" on public.necesidades for select using (true);

drop policy if exists "necesidades_insert_all" on public.necesidades;
create policy "necesidades_insert_all" on public.necesidades for insert with check (true);

drop policy if exists "necesidades_update_all" on public.necesidades;
create policy "necesidades_update_all" on public.necesidades for update using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'necesidades'
  ) then
    alter publication supabase_realtime add table public.necesidades;
  end if;
end $$;
