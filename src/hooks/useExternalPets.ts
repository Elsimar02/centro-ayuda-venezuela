"use client";

import { useEffect, useState } from "react";
import { Report } from "@/lib/types";
import { fetchExternalPets } from "@/lib/externalSources";

export function useExternalPets() {
  const [externalPets, setExternalPets] = useState<Report[]>([]);

  useEffect(() => {
    let active = true;
    fetchExternalPets().then((rows) => {
      if (active) setExternalPets(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  return externalPets;
}
