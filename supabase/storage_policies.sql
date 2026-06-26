-- Permite subir y leer archivos en el bucket público report-media
-- (fotos de reportes: personas, mascotas, insumos, etc.)

create policy "report_media_insert_public" on storage.objects
  for insert with check (bucket_id = 'report-media');

create policy "report_media_select_public" on storage.objects
  for select using (bucket_id = 'report-media');
