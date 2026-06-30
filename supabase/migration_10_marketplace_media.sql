-- Agrega soporte de fotos a los registros del Marketplace ("Quiero Ayudar"),
-- para que al abrir el detalle de un colaborador se vean sus imágenes igual
-- que en un reporte normal. Ejecutar en el SQL Editor de Supabase.

alter table public.aid_providers
  add column if not exists media jsonb not null default '[]'::jsonb;
