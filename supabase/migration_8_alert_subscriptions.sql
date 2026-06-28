-- Suscripciones a alertas por correo: cuando una familia sigue a un desaparecido
-- y deja su correo, guardamos aquí {reporte, correo} para poder avisarle cuando
-- aparezca una posible coincidencia. El envío lo hace una ruta /api en Vercel
-- (con la service-role key), disparada por Vercel Cron.

create table if not exists public.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  email text not null,
  -- ids de los reportes-coincidencia que ya se notificaron, para no repetir.
  notified_match_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists alert_subscriptions_report_idx on public.alert_subscriptions(report_id);

alter table public.alert_subscriptions enable row level security;

-- Cualquiera (anónimo) puede crear una suscripción (dejar su correo). No se
-- permite leer/editar/borrar desde el cliente: los datos de contacto son
-- privados y solo los toca el servidor con la service-role key.
drop policy if exists "alert_subscriptions_insert_anon" on public.alert_subscriptions;
create policy "alert_subscriptions_insert_anon" on public.alert_subscriptions
  for insert with check (true);
