// De Mano en Mano Venezuela (demanoenmanove.org): centros (hospitales, ONGs,
// grupos de voluntarios) con sus necesidades de insumos en vivo. Backend es un
// Google Apps Script publicado con CORS abierto (Access-Control-Allow-Origin: *),
// así que se puede leer directo desde el navegador, sin proxy.
const DEMANO_API =
  "https://script.google.com/macros/s/AKfycbzX5pI5pnPazsDU8jPrrMbFpAxra149rNbjDWyYTwC_jhWTZORG_V3onD5LVd-fe8eY3g/exec";

export type DemanoNeed = {
  id: string;
  item: string;
  categoria: string;
  unidad: string;
  cantidad_pedida: number;
  cantidad_cubierta: number;
  urgencia: number;
};

export type DemanoCentro = {
  id: string;
  nombre: string;
  tipo: string;
  zona: string;
  estado: string;
  municipio: string;
  parroquia: string;
  sector: string;
  maps_url: string;
  whatsapp_publico: string;
  estado_centro: string;
  actualizado: string;
  necesidades: DemanoNeed[];
};

type DemanoResponse = { ok: boolean; centros: DemanoCentro[] };

// Solo centros con al menos una necesidad todavía pendiente (cantidad_pedida >
// cantidad_cubierta) — varios centros en la fuente están registrados pero sin
// nada por cubrir ahora mismo.
export async function fetchDemanoCentros(): Promise<DemanoCentro[]> {
  try {
    const res = await fetch(DEMANO_API, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = (await res.json()) as DemanoResponse;
    if (!data.ok) return [];
    return data.centros
      .map((c) => ({
        ...c,
        necesidades: c.necesidades
          .filter((n) => n.cantidad_pedida - n.cantidad_cubierta > 0)
          .sort((a, b) => b.urgencia - a.urgencia),
      }))
      .filter((c) => c.necesidades.length > 0);
  } catch {
    return [];
  }
}

export function demanoPlace(c: DemanoCentro): string {
  return [c.sector || c.zona, c.parroquia, c.municipio, c.estado].filter(Boolean).join(", ");
}
