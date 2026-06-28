import { Report } from "@/lib/types";

// Seguimiento de reportes guardado EN EL DISPOSITIVO (localStorage). No requiere
// cuenta ni backend: una familia marca "Seguir" a una persona y la app le muestra
// en un solo lugar el estado actual y si apareció una posible coincidencia.
// (Las notificaciones con la app cerrada requerirían Web Push + servidor; fase 2.)

const KEY = "ccc-follows-v1";

export type Follow = { id: string; nombre: string; type: string; place: string; ts: number };

function read(): Follow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: Follow[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("ccc-follows"));
}

export function getFollows(): Follow[] {
  return read();
}

export function isFollowing(id: string): boolean {
  return read().some((f) => f.id === id);
}

export function toggleFollow(report: Report): boolean {
  const list = read();
  const i = list.findIndex((f) => f.id === report.id);
  if (i >= 0) {
    list.splice(i, 1);
    write(list);
    return false;
  }
  list.unshift({
    id: report.id,
    nombre: report.details?.nombre || "",
    type: report.type,
    place: report.place,
    ts: Date.now(),
  });
  write(list);
  return true;
}
