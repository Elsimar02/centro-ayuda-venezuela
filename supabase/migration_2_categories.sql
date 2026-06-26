-- Amplía el esquema de reportes: nuevas categorías (personas, salud, mascotas)
-- + teléfono de contacto + detalles específicos por tipo (jsonb)

alter table public.reports drop constraint if exists reports_type_check;
alter table public.reports add constraint reports_type_check check (type in (
  'atrapada','colapso','bloqueo','peligro','ayuda','hospital','refugio','agua',
  'alimentos','medicinas','electricidad','internet',
  'persona_desaparecida','persona_encontrada_viva','persona_fallecida',
  'hospital_insumos','insumos_disponibles',
  'mascota_perdida','mascota_encontrada'
));

alter table public.reports add column if not exists contact_phone text;
alter table public.reports add column if not exists details jsonb not null default '{}'::jsonb;
