// Lectura en vivo (solo lectura, sin copiar a nuestra base de datos) de la API
// pública de redayudavenezuela.com: mascotas perdidas/encontradas y voluntarios
// individuales. Como nunca escribimos esto en nuestra tabla `reports`, si algo
// se marca resuelto o se borra en su plataforma, desaparece de la nuestra en la
// siguiente carga — no hay que sincronizar nada a mano.
//
// La anon key es pública por diseño (la usa el propio frontend de ese sitio en
// el navegador de cualquier visitante), igual que la nuestra en .env.local.
import { Report, ReportType } from "./types";

const EXT_SB_URL = "https://cpavwkdonvkvrwygfzfo.supabase.co";
const EXT_SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYXZ3a2RvbnZrdnJ3eWdmemZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjAyODMsImV4cCI6MjA5NzkzNjI4M30.-_FAsA2csTrB9qt267pBfjJkczMP7pcaUi4plMv3kv4";

const EXTERNAL_SOURCE = { source: "redayudavenezuela.com", url: "https://redayudavenezuela.com" };

type ExternalRow = {
  id: string;
  kind: string;
  category: string;
  title: string;
  description: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  contact: string | null;
  photo_url: string | null;
  created_at: string;
};

async function fetchExternalRows(kind: "mascota" | "voluntario"): Promise<ExternalRow[]> {
  try {
    const res = await fetch(
      `${EXT_SB_URL}/rest/v1/reports?kind=eq.${kind}&status=eq.activo&source=is.null&select=id,kind,category,title,description,city,state,lat,lng,contact,photo_url,created_at&order=created_at.desc&limit=500`,
      { headers: { apikey: EXT_SB_KEY, Authorization: `Bearer ${EXT_SB_KEY}` } }
    );
    if (!res.ok) return [];
    return (await res.json()) as ExternalRow[];
  } catch {
    return [];
  }
}

// Coordenadas aproximadas por ciudad (geocodificadas una sola vez; las ciudades
// no se mueven, así que no hace falta volver a geocodificar en cada carga).
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "caraballeda|la guaira": { lat: 10.6198698, lng: -66.8506656 },
  "playa verde, catia la mar,|la guaira": { lat: 10.6087187, lng: -67.0181953 },
  "la pastora|distrito capital": { lat: 10.5317491, lng: -66.9242071 },
  "caricuao|distrito capital": { lat: 10.4347133, lng: -67.0005958 },
  "la candelaria|distrito capital": { lat: 10.5072238, lng: -66.9057763 },
  "playa grande, catia la mar, estado la guaira|la guaira": { lat: 10.6087187, lng: -67.0181953 },
  "catia y los magallanes|la guaira": { lat: 10.5085527, lng: -66.9391395 },
  "el paraiso|distrito capital": { lat: 10.4829776, lng: -66.9418795 },
  "los chaguaramos|distrito capital": { lat: 10.483201, lng: -66.8867728 },
  "lidice - la pastora|distrito capital": { lat: 10.5206963, lng: -66.92689 },
  "macuto|la guaira": { lat: 10.6030784, lng: -66.9058693 },
  "torre c bloque op33|la guaira": { lat: 10.5964668, lng: -66.9518013 },
  "playa grande|la guaira": { lat: 10.6247596, lng: -66.7190381 },
  "tanaguarenas|la guaira": { lat: 10.6123221, lng: -66.8168267 },
  "la guaira|la guaira": { lat: 10.6000384, lng: -66.9296405 },
  "quinta crespo|distrito capital": { lat: 10.4969034, lng: -66.9173218 },
  "madre maría de san josé. maracay.|aragua": { lat: 10.2235869, lng: -67.5964407 },
  "av. bolivar norte res. pecchineda/ c.c camoruco. valencia|carabobo": { lat: 10.1930231, lng: -68.0055299 },
  "el remanso. san diego. valencia|carabobo": { lat: 10.2624764, lng: -67.9609675 },
  "brisas-boqueron-via principal el junquito|distrito capital": { lat: 10.5077285, lng: -66.9646337 },
  "bahía mar|la guaira": { lat: 10.5898817, lng: -66.9932402 },
  "carapita, calle nueva|distrito capital": { lat: 10.4738592, lng: -66.97365 },
  "guatire|miranda": { lat: 10.4684588, lng: -66.5431115 },
  "caracas-miranda|distrito capital": { lat: 10.4896371, lng: -66.8808797 },
  "coral mar|la guaira": { lat: 10.6149582, lng: -66.8603049 },
  "maracay|aragua": { lat: 10.2375144, lng: -67.5890216 },
  "caribe|la guaira": { lat: 10.6202323, lng: -66.8498639 },
  "caracas, cementerio peaje|distrito capital": { lat: 10.4864172, lng: -66.9101119 },
  "catia la mar- catia|la guaira": { lat: 10.5967284, lng: -66.9790917 },
  "los chaguaramos, av. la ciencia.|distrito capital": { lat: 10.4815545, lng: -66.8892223 },
  "corales/ caraballeda|la guaira": { lat: 10.6180254, lng: -66.8583238 },
  "playa grande, catia la mar.|la guaira": { lat: 10.6087187, lng: -67.0181953 },
  "av andrés bello , cruce con la salle, caracas|distrito capital": { lat: 10.5038256, lng: -66.8835049 },
  "playa verde|la guaira": { lat: 10.6030784, lng: -66.9058693 },
  "2 av. del amparo. catia|distrito capital": { lat: 10.5077285, lng: -66.9646337 },
  "playa grande residencias acapro|la guaira": { lat: 10.6149582, lng: -66.8603049 },
  "el limón, maracay|aragua": { lat: 10.3223613, lng: -67.6515975 },
  "catia la mar|la guaira": { lat: 10.5967284, lng: -66.9790917 },
  "puerto viejo|la guaira": { lat: 10.6027333, lng: -66.9336438 },
  "av. granada|la guaira": { lat: 10.6000214, lng: -66.9438602 },
  "23 de enero|distrito capital": { lat: 10.5076023, lng: -66.9312039 },
  "corales|la guaira": { lat: 10.6180254, lng: -66.8583238 },
  "altamira/la floresta|distrito capital": { lat: 10.4933569, lng: -66.9383138 },
  "moron|carabobo": { lat: 10.4861731, lng: -68.2027171 },
  "maracay|carabobo": { lat: 10.2815434, lng: -67.6878151 },
  "av. granada, la guaira.|la guaira": { lat: 10.6000384, lng: -66.9296405 },
  "catia la mar, summa|la guaira": { lat: 10.5967284, lng: -66.9790917 },
  "la dolorita|miranda": { lat: 10.4613995, lng: -66.7624514 },
  "caracas|miranda": { lat: 10.4707551, lng: -66.8372571 },
  "maracay sector sta. rosa|aragua": { lat: 10.2340809, lng: -67.5542897 },
  "fuerte tiuna|distrito capital": { lat: 10.4370009, lng: -66.910723 },
  "sta. monica|distrito capital": { lat: 10.4765634, lng: -66.890286 },
};

// Respaldo cuando la ciudad no está en el diccionario pero sí sabemos el estado.
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  "la guaira": { lat: 10.6000384, lng: -66.9296405 },
  "distrito capital": { lat: 10.4901789, lng: -66.8916633 },
  aragua: { lat: 9.9648775, lng: -67.1299839 },
  miranda: { lat: 10.2343499, lng: -66.3807249 },
  carabobo: { lat: 10.1686583, lng: -68.0350028 },
};

function resolveCoords(row: ExternalRow): { lat: number; lng: number } | null {
  if (row.lat && row.lng) return { lat: row.lat, lng: row.lng };
  const city = (row.city || "").trim().toLowerCase();
  const state = (row.state || "").trim().toLowerCase();
  if (!city && !state) return null;
  const byCity = CITY_COORDS[`${city}|${state}`];
  if (byCity) return byCity;
  return STATE_COORDS[state] || null;
}

export async function fetchExternalPets(): Promise<Report[]> {
  const rows = await fetchExternalRows("mascota");
  const out: Report[] = [];
  for (const row of rows) {
    const coords = resolveCoords(row);
    if (!coords) continue; // sin ubicación usable, no se puede ubicar en el mapa
    const type: ReportType = row.category === "encontrada" ? "mascota_encontrada" : "mascota_perdida";
    out.push({
      id: `ext-mascota-${row.id}`,
      type,
      lat: coords.lat,
      lng: coords.lng,
      place: [row.title, row.city, row.state].filter(Boolean).join(", "),
      description: row.description || "(Sin descripción)",
      urgency: "baja",
      status: "sin_verificar",
      people: 0,
      confidence: 40,
      vc_confirm: 0,
      vc_attended: 0,
      vc_incorrect: 0,
      vc_resolved: 0,
      reporter_name: "Comunidad (redayudavenezuela.com)",
      contact_phone: row.contact,
      details: {},
      media: row.photo_url ? [{ kind: "foto", url: row.photo_url }] : [],
      created_at: row.created_at,
      external: EXTERNAL_SOURCE,
    });
  }
  return out;
}

export type ExternalVolunteer = {
  id: string;
  category: string;
  title: string;
  description: string;
  city: string | null;
  state: string | null;
  contact: string | null;
  created_at: string;
};

export async function fetchExternalVolunteers(): Promise<ExternalVolunteer[]> {
  const rows = await fetchExternalRows("voluntario");
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description,
    city: r.city,
    state: r.state,
    contact: r.contact,
    created_at: r.created_at,
  }));
}

// Red de Esperanza (red-de-esperanza-lime.vercel.app): otra plataforma de
// reportes de desastre con Supabase público. A diferencia de redayudavenezuela,
// mezcla datos de varios países (vimos centros de acopio en Bogotá y una
// necesidad en Santiago de Chile), así que TODO lo que traemos de aquí se
// filtra primero por este bounding box de Venezuela.
const ESPERANZA_SB_URL = "https://hqoirxajavaaasvdfjoy.supabase.co";
const ESPERANZA_SB_KEY = "sb_publishable_4qdzpICdtyX6N_XqiVmuYw_Jv_zYvOq";
const ESPERANZA_SOURCE = { source: "Red de Esperanza", url: "https://red-de-esperanza-lime.vercel.app" };
const VE_BBOX = "lat=gte.0.6&lat=lte.13&lng=gte.-74&lng=lte.-59";

async function esperanzaGet(path: string): Promise<Record<string, never>[]> {
  try {
    const res = await fetch(`${ESPERANZA_SB_URL}/rest/v1/${path}`, {
      headers: { apikey: ESPERANZA_SB_KEY, Authorization: `Bearer ${ESPERANZA_SB_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function normalizeText(s: string | null | undefined): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sharesName(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = new Set(normalizeText(a).split(" ").filter((t) => t.length >= 3));
  const tb = new Set(normalizeText(b).split(" ").filter((t) => t.length >= 3));
  if (ta.size === 0 || tb.size === 0) return false;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared >= Math.min(2, Math.min(ta.size, tb.size));
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Su tabla `necesidades` usa categorías propias distintas a nuestro ReportType;
// las mapeamos a lo más parecido que ya tenemos.
const NECESIDAD_TIPO_TO_REPORT_TYPE: Partial<Record<string, ReportType>> = {
  rescate: "atrapada",
  derrumbe: "colapso",
  refugio: "refugio",
  agua_comida: "alimentos",
  medicinas: "hospital_insumos",
  otro: "peligro",
  zona_sin_atender: "peligro",
};

// Solo el último lote importado (todas las filas de una misma carga comparten
// el mismo `creado_en`), no los ~20.000 acumulados — si no, serían demasiados
// pines para el mapa y en su mayoría ya viejos.
export async function fetchEsperanzaMissing(): Promise<Report[]> {
  const latest = await esperanzaGet("desaparecidos?select=creado_en&order=creado_en.desc&limit=1");
  const cutoff = (latest[0] as { creado_en?: string } | undefined)?.creado_en;
  if (!cutoff) return [];
  const rows = await esperanzaGet(
    `desaparecidos?select=id,nombre,fecha_desaparicion,ultima_ubicacion,lat,lng,contacto_familiar,creado_en&${VE_BBOX}&creado_en=eq.${encodeURIComponent(cutoff)}&limit=500`
  );
  return (rows as unknown as {
    id: string; nombre: string | null; fecha_desaparicion: string | null; ultima_ubicacion: string | null;
    lat: number | null; lng: number | null; contacto_familiar: string | null; creado_en: string;
  }[])
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: `esperanza-desaparecido-${r.id}`,
      type: "persona_desaparecida" as ReportType,
      lat: r.lat as number,
      lng: r.lng as number,
      place: r.ultima_ubicacion || "",
      description: `Desaparecido/a desde ${r.fecha_desaparicion || "fecha sin precisar"} — última ubicación: ${r.ultima_ubicacion || "sin precisar"}.`,
      urgency: "alta",
      status: "sin_verificar",
      people: 1,
      confidence: 40,
      vc_confirm: 0,
      vc_attended: 0,
      vc_incorrect: 0,
      vc_resolved: 0,
      reporter_name: "Comunidad (Red de Esperanza)",
      contact_phone: r.contacto_familiar,
      details: { nombre: r.nombre || "" },
      media: [],
      created_at: r.creado_en,
      external: ESPERANZA_SOURCE,
    })) as Report[];
}

export async function fetchEsperanzaNeeds(): Promise<Report[]> {
  const rows = await esperanzaGet(
    `necesidades?select=id,tipo,urgencia,descripcion,lat,lng,zona,creado_en&${VE_BBOX}&limit=1000`
  );
  return (rows as unknown as {
    id: string; tipo: string; urgencia: string | null; descripcion: string | null;
    lat: number | null; lng: number | null; zona: string | null; creado_en: string;
  }[])
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: `esperanza-necesidad-${r.id}`,
      type: NECESIDAD_TIPO_TO_REPORT_TYPE[r.tipo] ?? "peligro",
      lat: r.lat as number,
      lng: r.lng as number,
      place: r.zona || "",
      description: r.descripcion || "(Sin descripción)",
      urgency: r.urgencia === "alta" ? "alta" : r.urgencia === "media" ? "media" : "baja",
      status: "sin_verificar",
      people: 0,
      confidence: 40,
      vc_confirm: 0,
      vc_attended: 0,
      vc_incorrect: 0,
      vc_resolved: 0,
      reporter_name: "Comunidad (Red de Esperanza)",
      contact_phone: null,
      details: {},
      media: [],
      created_at: r.creado_en,
      external: ESPERANZA_SOURCE,
    })) as Report[];
}

export async function fetchEsperanzaCollectionCenters(): Promise<Report[]> {
  const rows = await esperanzaGet(
    `centros_acopio?select=id,nombre,descripcion,direccion,lat,lng,creado_en,contacto&${VE_BBOX}&limit=200`
  );
  return (rows as unknown as {
    id: string; nombre: string | null; descripcion: string | null; direccion: string | null;
    lat: number | null; lng: number | null; creado_en: string; contacto: string | null;
  }[])
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: `esperanza-acopio-${r.id}`,
      type: "ayuda" as ReportType,
      lat: r.lat as number,
      lng: r.lng as number,
      place: [r.nombre, r.direccion].filter(Boolean).join(", "),
      description: r.descripcion || "Centro de acopio",
      urgency: "baja",
      status: "sin_verificar",
      people: 0,
      confidence: 40,
      vc_confirm: 0,
      vc_attended: 0,
      vc_incorrect: 0,
      vc_resolved: 0,
      reporter_name: "Comunidad (Red de Esperanza)",
      contact_phone: r.contacto,
      details: {},
      media: [],
      created_at: r.creado_en,
      external: ESPERANZA_SOURCE,
    })) as Report[];
}

// Evita duplicar algo que ya tenemos reportado nosotros mismos: mismo tipo,
// cerca en el mapa, y (cuando hay nombre) nombre parecido.
export function dedupeEsperanza(externalRows: Report[], localReports: Report[]): Report[] {
  return externalRows.filter(
    (ext) =>
      !localReports.some((local) => {
        if (local.type !== ext.type) return false;
        const dist = haversineKm({ lat: ext.lat, lng: ext.lng }, { lat: local.lat, lng: local.lng });
        const radiusKm = ext.type === "persona_desaparecida" ? 5 : ext.type === "ayuda" ? 1 : 0.3;
        if (dist > radiusKm) return false;
        if (ext.type === "persona_desaparecida") return sharesName(ext.details?.nombre, local.details?.nombre);
        if (ext.type === "ayuda") return sharesName(ext.place, local.place);
        return true; // necesidades: mismo tipo + cerca ya cuenta como duplicado
      })
  );
}
