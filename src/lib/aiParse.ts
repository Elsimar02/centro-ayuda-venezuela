import { Draft, ReportType, TYPE_FIELDS, Urgency } from "@/lib/types";

export type ParsedFields = {
  tipo: ReportType | null;
  nombre: string | null;
  edad: string | null;
  ubicacion: string | null;
  telefono: string | null;
  descripcion_fisica: string | null;
  personas_afectadas: number | null;
  descripcion: string | null;
  urgencia: Urgency | null;
};

async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?limit=1&lat=8&lon=-66&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const f = data?.features?.[0];
    if (!f) return null;
    const [lng, lat] = f.geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function parseText(text: string): Promise<ParsedFields> {
  const res = await fetch("/api/parse-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const parsed: ParsedFields = await res.json();
  if (!res.ok) throw new Error((parsed as unknown as { error?: string }).error || "Error al procesar el texto.");
  return parsed;
}

export async function buildDraftFromParsed(parsed: ParsedFields, text: string): Promise<Partial<Draft>> {
  const fields = parsed.tipo ? TYPE_FIELDS[parsed.tipo] || [] : [];
  const extra: Record<string, string> = {};
  for (const f of fields) {
    if (f.key === "nombre" && parsed.nombre) extra[f.key] = parsed.nombre;
    if (f.key === "edad" && parsed.edad) extra[f.key] = parsed.edad;
    if (f.key === "descripcion_fisica" && parsed.descripcion_fisica) extra[f.key] = parsed.descripcion_fisica;
    if (f.key === "descripcion" && parsed.descripcion_fisica) extra[f.key] = parsed.descripcion_fisica;
  }

  let locPatch: Partial<Draft> = {};
  if (parsed.ubicacion) {
    const coords = await geocodeAddress(parsed.ubicacion);
    locPatch = coords
      ? { loc: "manual", manual: parsed.ubicacion, manualCoords: coords }
      : { loc: "referencia", reference: parsed.ubicacion };
  }

  return {
    type: parsed.tipo ?? null,
    desc: parsed.descripcion || text.trim(),
    name: parsed.nombre || "",
    phone: parsed.telefono || "",
    people: parsed.personas_afectadas || 1,
    urgency: parsed.urgencia || "alta",
    extra,
    ...locPatch,
  };
}
