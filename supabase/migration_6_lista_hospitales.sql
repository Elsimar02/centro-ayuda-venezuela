-- Añade la categoría "persona_lista_hospital": personas que aparecen en listas
-- de pacientes ingresados a hospitales (no son reportes de desaparición de un
-- familiar). Se muestra en un apartado separado con un aviso de que es
-- información delicada y sin confirmar, recopilada para ayudar a las familias.

alter table public.reports drop constraint if exists reports_type_check;
alter table public.reports add constraint reports_type_check check (type in (
  'atrapada','colapso','bloqueo','peligro','ayuda','hospital','refugio','agua',
  'alimentos','medicinas','electricidad','internet',
  'persona_desaparecida','persona_encontrada_viva','persona_fallecida',
  'hospital_insumos','insumos_disponibles',
  'mascota_perdida','mascota_encontrada',
  'persona_lista_hospital'
));
