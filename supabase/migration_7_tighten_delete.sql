-- Seguridad (hallazgo de React Doctor): la política de borrado anterior era
-- "for delete using (true)", lo que permitía a cualquiera borrar CUALQUIER
-- reporte vía la API, saltándose la lógica de la app. La app solo borra reportes
-- con más de 7 confirmaciones de "resuelto" (RESOLVE_THRESHOLD). Endurecemos la
-- política para que la base de datos exija lo mismo (defensa en profundidad).

drop policy if exists "reports_delete_all" on public.reports;

create policy "reports_delete_resolved" on public.reports
  for delete using (vc_resolved > 7);
