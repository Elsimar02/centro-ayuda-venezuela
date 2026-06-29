"use client";

import { useEffect, useState } from "react";
import { DemanoCentro, fetchDemanoCentros } from "@/lib/demano";

// Solo se busca cuando `active` es true (la vista de Marketplace está abierta).
export function useDemanoCentros(active: boolean) {
  const [centros, setCentros] = useState<DemanoCentro[] | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetchDemanoCentros().then((rows) => {
      if (!cancelled) setCentros(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return { centros: centros ?? [], loading: active && centros === null };
}
