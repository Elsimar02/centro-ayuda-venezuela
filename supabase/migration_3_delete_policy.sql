-- Faltaba la política de DELETE: sin esto, los "borrados" desde la app
-- no borraban nada de verdad (RLS los bloqueaba silenciosamente).
--
-- NOTA: esta política abierta queda reemplazada por
-- migration_4_resolved_threshold.sql, que la vuelve a crear exigiendo
-- vc_resolved > 7. Se deja este archivo tal cual por historial; no
-- representa el estado actual de la política en la base de datos.

create policy "reports_delete_all" on public.reports
  for delete using (true);

create policy "report_media_delete_public" on storage.objects
  for delete using (bucket_id = 'report-media');

-- Limpieza de los registros de prueba que quedaron pegados por este bug:
delete from public.reports where place in ('Test smoke', 'Test');
