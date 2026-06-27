"use client";

import { useEffect, useState } from "react";
import { ExternalVolunteer, fetchExternalVolunteers } from "@/lib/externalSources";

// Solo se busca cuando `active` es true (la pestaña de Voluntariado está
// abierta) para no traer ~500 filas en cada carga de la app.
export function useExternalVolunteers(active: boolean) {
  const [volunteers, setVolunteers] = useState<ExternalVolunteer[] | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetchExternalVolunteers().then((rows) => {
      if (!cancelled) setVolunteers(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return { volunteers: volunteers ?? [], loading: active && volunteers === null };
}
