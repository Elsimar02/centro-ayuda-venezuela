"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "ccc_device_id";

// Contador silencioso: no renderiza nada. Cada dispositivo se identifica una
// sola vez (localStorage) y se registra como máximo una fila en device_visits.
export function DeviceVisitTracker() {
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const deviceId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, deviceId);
      supabase.from("device_visits").insert({ device_id: deviceId }).then(() => {});
    } catch {
      // localStorage bloqueado o sin red: no es crítico, simplemente no se cuenta.
    }
  }, []);

  return null;
}
