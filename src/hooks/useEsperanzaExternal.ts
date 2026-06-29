"use client";

import { useEffect, useMemo, useState } from "react";
import { Report } from "@/lib/types";
import {
  dedupeEsperanza,
  fetchEsperanzaCollectionCenters,
  fetchEsperanzaMissing,
  fetchEsperanzaNeeds,
} from "@/lib/externalSources";

// Trae datos de Red de Esperanza (ya filtrados a Venezuela y al último lote de
// desaparecidos) y los compara contra nuestros propios reportes para no
// duplicar algo que ya tenemos.
export function useEsperanzaExternal(localReports: Report[]) {
  const [raw, setRaw] = useState<Report[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchEsperanzaMissing(), fetchEsperanzaNeeds(), fetchEsperanzaCollectionCenters()]).then(
      (lists) => {
        if (!cancelled) setRaw(lists.flat());
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => (raw ? dedupeEsperanza(raw, localReports) : []), [raw, localReports]);
}
