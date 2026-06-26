-- Faltaba la política de DELETE: sin esto, los "borrados" desde la app
-- no borraban nada de verdad (RLS los bloqueaba silenciosamente).

create policy "reports_delete_all" on public.reports
  for delete using (true);

create policy "report_media_delete_public" on storage.objects
  for delete using (bucket_id = 'report-media');

-- Limpieza de los registros de prueba que quedaron pegados por este bug:
delete from public.reports where place in ('Test smoke', 'Test');
