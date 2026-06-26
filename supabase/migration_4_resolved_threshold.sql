-- Un reporte solo se puede eliminar cuando más de 7 personas confirmaron
-- que ya está resuelto (botón "✅ Ya está resuelto" en la app).

alter table public.reports add column if not exists vc_resolved integer not null default 0;

drop policy if exists "reports_delete_all" on public.reports;
create policy "reports_delete_all" on public.reports
  for delete using (vc_resolved > 7);
