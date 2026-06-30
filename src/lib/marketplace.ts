import { supabase } from "./supabase";
import { fetchNeeds } from "./needsApi";
import { NEEDS_LIST, NeedReport } from "./needs";
import { MediaItem } from "./types";

// ── Marketplace Solidario ──────────────────────────────────────────────
// Directorio de colaboradores que ofrecen y/o necesitan recursos durante el
// desastre. Datos en la tabla `aid_providers` (ver supabase/migration_9_marketplace.sql).

export type ProviderKind =
  | "persona"
  | "empresa"
  | "ong"
  | "iglesia"
  | "voluntario"
  | "refugio"
  | "centro_acopio"
  | "institucion";

export type Availability = "inmediata" | "programada";
export type ProviderStatus = "activo" | "pausado" | "cerrado";

export type AidProvider = {
  id: string;
  kind: ProviderKind;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  lat: number;
  lng: number;
  place: string;
  radius_km: number;
  offers: string[];
  needs: string[];
  quantity: string;
  availability: Availability;
  available_from: string | null;
  schedule: string;
  notes: string;
  status: ProviderStatus;
  media: MediaItem[];
  created_at: string;
};

export const PROVIDER_KINDS: { id: ProviderKind; label: string; emoji: string }[] = [
  { id: "persona", label: "Persona", emoji: "👤" },
  { id: "empresa", label: "Empresa", emoji: "🏢" },
  { id: "ong", label: "ONG / Fundación", emoji: "🤲" },
  { id: "iglesia", label: "Iglesia", emoji: "⛪" },
  { id: "voluntario", label: "Voluntario", emoji: "🙋" },
  { id: "refugio", label: "Refugio / Albergue", emoji: "⛺" },
  { id: "centro_acopio", label: "Centro de acopio", emoji: "📦" },
  { id: "institucion", label: "Institución", emoji: "🏛️" },
];

export const KIND_CONFIG: Record<ProviderKind, { label: string; emoji: string }> = Object.fromEntries(
  PROVIDER_KINDS.map((k) => [k.id, { label: k.label, emoji: k.emoji }])
) as Record<ProviderKind, { label: string; emoji: string }>;

// ── Catálogo de recursos ──
// `key` es el identificador estable que se guarda en offers[]/needs[]. Los grupos
// permiten filtrar y mostrar el formulario ordenado por categoría.
export type ResourceGroup =
  | "suministros"
  | "refugio"
  | "transporte"
  | "energia"
  | "personal_medico"
  | "personal_tecnico"
  | "oficios"
  | "materiales"
  | "mascotas"
  | "negocio"
  | "exterior"
  | "otros";

export type Resource = { key: string; label: string; emoji: string; group: ResourceGroup };

export const RESOURCE_GROUPS: { id: ResourceGroup; label: string; emoji: string }[] = [
  { id: "suministros", label: "Suministros", emoji: "📦" },
  { id: "refugio", label: "Refugio y espacio", emoji: "⛺" },
  { id: "transporte", label: "Transporte y logística", emoji: "🚚" },
  { id: "energia", label: "Energía e infraestructura", emoji: "⚡" },
  { id: "personal_medico", label: "Personal médico", emoji: "🩺" },
  { id: "personal_tecnico", label: "Personal técnico y rescate", emoji: "🛠️" },
  { id: "oficios", label: "Oficios", emoji: "🧰" },
  { id: "materiales", label: "Materiales y herramientas", emoji: "🔧" },
  { id: "mascotas", label: "Mascotas y animales", emoji: "🐾" },
  { id: "negocio", label: "Negocio a disposición", emoji: "🏪" },
  { id: "exterior", label: "Desde el exterior", emoji: "🌍" },
  { id: "otros", label: "Otros", emoji: "➕" },
];

export const RESOURCES: Resource[] = [
  // Suministros
  { key: "agua", label: "Agua", emoji: "💧", group: "suministros" },
  { key: "comida", label: "Comida", emoji: "🍞", group: "suministros" },
  { key: "medicinas", label: "Medicinas", emoji: "💊", group: "suministros" },
  { key: "ropa", label: "Ropa", emoji: "👕", group: "suministros" },
  { key: "zapatos", label: "Zapatos", emoji: "👟", group: "suministros" },
  { key: "leche", label: "Leche", emoji: "🥛", group: "suministros" },
  { key: "panales", label: "Pañales", emoji: "🍼", group: "suministros" },
  { key: "cobijas", label: "Cobijas", emoji: "🛌", group: "suministros" },
  // Refugio y espacio
  { key: "carpas", label: "Carpas", emoji: "⛺", group: "refugio" },
  { key: "colchones", label: "Colchones", emoji: "🛏️", group: "refugio" },
  { key: "albergue", label: "Albergue", emoji: "🏠", group: "refugio" },
  { key: "espacio_dormir", label: "Espacio para dormir", emoji: "🛌", group: "refugio" },
  { key: "cocina_comunitaria", label: "Cocina comunitaria", emoji: "🍲", group: "refugio" },
  // Transporte y logística
  { key: "ambulancia", label: "Ambulancia", emoji: "🚑", group: "transporte" },
  { key: "camion", label: "Camión", emoji: "🚛", group: "transporte" },
  { key: "helicoptero", label: "Helicóptero", emoji: "🚁", group: "transporte" },
  { key: "lancha", label: "Lancha", emoji: "🛥️", group: "transporte" },
  { key: "vehiculos", label: "Vehículos", emoji: "🚗", group: "transporte" },
  { key: "conductores", label: "Conductores", emoji: "🧑‍✈️", group: "transporte" },
  { key: "combustible", label: "Combustible", emoji: "⛽", group: "transporte" },
  // Energía e infraestructura
  { key: "planta_electrica", label: "Planta eléctrica", emoji: "🔌", group: "energia" },
  { key: "generadores", label: "Generadores", emoji: "🔋", group: "energia" },
  { key: "internet_satelital", label: "Internet satelital", emoji: "📡", group: "energia" },
  { key: "maquinaria_pesada", label: "Maquinaria pesada", emoji: "🚜", group: "energia" },
  { key: "retroexcavadora", label: "Retroexcavadora", emoji: "🚜", group: "energia" },
  { key: "grua", label: "Grúa", emoji: "🏗️", group: "energia" },
  { key: "excavadora", label: "Excavadora", emoji: "⛏️", group: "energia" },
  // Personal médico
  { key: "medicos", label: "Médicos", emoji: "👨‍⚕️", group: "personal_medico" },
  { key: "enfermeros", label: "Enfermeros", emoji: "👩‍⚕️", group: "personal_medico" },
  { key: "paramedicos", label: "Paramédicos", emoji: "🚑", group: "personal_medico" },
  { key: "psicologos", label: "Psicólogos", emoji: "🧠", group: "personal_medico" },
  { key: "veterinarios", label: "Veterinarios", emoji: "🐾", group: "personal_medico" },
  // Personal técnico y rescate
  { key: "electricistas", label: "Electricistas", emoji: "💡", group: "personal_tecnico" },
  { key: "rescatistas", label: "Rescatistas", emoji: "🦺", group: "personal_tecnico" },
  { key: "ingenieros", label: "Ingenieros", emoji: "📐", group: "personal_tecnico" },
  { key: "arquitectos", label: "Arquitectos", emoji: "📏", group: "personal_tecnico" },
  // Oficios
  { key: "plomeros", label: "Plomeros", emoji: "🔧", group: "oficios" },
  { key: "albaniles", label: "Albañiles", emoji: "🧱", group: "oficios" },
  { key: "carpinteros", label: "Carpinteros", emoji: "🪚", group: "oficios" },
  { key: "herreros", label: "Herreros", emoji: "⚒️", group: "oficios" },
  { key: "cocineros", label: "Cocineros", emoji: "🍳", group: "oficios" },
  { key: "transportistas", label: "Transportistas", emoji: "🚐", group: "oficios" },
  // Materiales y herramientas
  { key: "herramientas", label: "Herramientas", emoji: "🔨", group: "materiales" },
  { key: "materiales_construccion", label: "Materiales de construcción", emoji: "🧱", group: "materiales" },
  { key: "cemento", label: "Cemento", emoji: "🪣", group: "materiales" },
  { key: "madera", label: "Madera", emoji: "🪵", group: "materiales" },
  { key: "lonas_plasticos", label: "Lonas y plásticos", emoji: "🧵", group: "materiales" },
  // Mascotas y animales
  { key: "alimento_mascotas", label: "Alimento para mascotas", emoji: "🐶", group: "mascotas" },
  { key: "rescate_animal", label: "Rescate de animales", emoji: "🐾", group: "mascotas" },
  { key: "veterinaria", label: "Atención veterinaria", emoji: "🐾", group: "mascotas" },
  { key: "refugio_animales", label: "Refugio para animales", emoji: "🏠", group: "mascotas" },
  // Negocio a disposición
  { key: "espacio_comercial", label: "Espacio comercial / local", emoji: "🏪", group: "negocio" },
  { key: "wifi_punto", label: "Punto de wifi/carga", emoji: "📶", group: "negocio" },
  { key: "servicios_empresa", label: "Servicios de empresa", emoji: "🏢", group: "negocio" },
  // Desde el exterior
  { key: "envio_internacional", label: "Envío internacional", emoji: "✈️", group: "exterior" },
  { key: "remesa_ayuda", label: "Remesa de ayuda", emoji: "💸", group: "exterior" },
  { key: "gestion_remota", label: "Gestión remota", emoji: "💻", group: "exterior" },
  // Otros
  { key: "voluntarios", label: "Voluntarios", emoji: "🙋", group: "otros" },
  { key: "donaciones", label: "Donaciones económicas", emoji: "💵", group: "otros" },
  { key: "otro", label: "Otro", emoji: "➕", group: "otros" },
];

export const RESOURCE_MAP: Record<string, Resource> = Object.fromEntries(
  RESOURCES.map((r) => [r.key, r])
);

export function resourceLabel(key: string): string {
  return RESOURCE_MAP[key]?.label ?? key;
}
export function resourceEmoji(key: string): string {
  return RESOURCE_MAP[key]?.emoji ?? "•";
}

// ── Distancia (Haversine, km) ──
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── Matching: para una necesidad (recurso + ubicación) encuentra colaboradores
// que lo OFRECEN, priorizando distancia, disponibilidad inmediata y respuesta
// reciente. Devuelve los mejores N con su distancia y puntaje. ──
export type ProviderMatch = { provider: AidProvider; distanceKm: number; score: number };

export function findOffersFor(
  resourceKey: string,
  near: { lat: number; lng: number } | null,
  providers: AidProvider[],
  limit = 12
): ProviderMatch[] {
  const now = Date.now();
  const out: ProviderMatch[] = [];
  for (const p of providers) {
    if (p.status !== "activo" || !p.offers.includes(resourceKey)) continue;
    const d = near ? distanceKm(near, p) : 0;
    // Si declara radio de entrega y la necesidad queda fuera, lo descartamos.
    if (near && p.radius_km > 0 && d > p.radius_km) continue;

    // Puntaje 0–100: cerca pesa más, luego disponibilidad inmediata, luego
    // qué tan reciente se registró (proxy de "sigue activo / responde rápido").
    const proximity = near ? Math.max(0, 1 - d / 50) : 0.5; // 0 km→1, 50+ km→0
    const immediate = p.availability === "inmediata" ? 1 : 0.4;
    const ageDays = (now - new Date(p.created_at).getTime()) / 86_400_000;
    const freshness = Math.max(0, 1 - ageDays / 14); // <14 días aporta
    const score = Math.round((proximity * 0.6 + immediate * 0.25 + freshness * 0.15) * 100);
    out.push({ provider: p, distanceKm: d, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ── Puente con "Necesidades Humanitarias" (tabla `necesidades`) ──
// Ese módulo usa su propio catálogo de claves (NEEDS_LIST) distinto al de
// RESOURCES. Para mostrarlas dentro del Marketplace (lista y mapa de
// "necesitan") las adaptamos a una forma común sin tocar su tabla ni su modelo.
export type NeedEntry = {
  id: string;
  // "necesidad": vino del módulo Necesidades Humanitarias (tabla `necesidades`).
  // "reporte": alguien lo reportó por error en el formulario de reportes en vez
  // de registrarse aquí (ver fetchMisfiledNeedReports más abajo).
  source: "necesidad" | "reporte";
  name: string;
  place: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  needs: string[]; // claves de NEEDS_LIST (vacío si viene de "reporte": usa notes en su lugar)
  notes: string;
  media: MediaItem[];
  created_at: string;
};

const NEED_LABEL_MAP: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  NEEDS_LIST.map((n) => [n.key, { label: n.label, emoji: n.emoji }])
);

export function needResourceLabel(key: string): string {
  return NEED_LABEL_MAP[key]?.label ?? key;
}
export function needResourceEmoji(key: string): string {
  return NEED_LABEL_MAP[key]?.emoji ?? "•";
}

function placeForNeed(n: NeedReport): string {
  return [n.direccion, n.parroquia, n.municipio, n.estado].filter(Boolean).join(", ");
}

function needToEntry(n: NeedReport): NeedEntry {
  return {
    id: n.id,
    source: "necesidad",
    name: n.contact_name || "Familia / comunidad",
    place: placeForNeed(n),
    lat: n.lat,
    lng: n.lng,
    phone: n.contact_phone || null,
    whatsapp: n.contact_whatsapp || null,
    email: n.contact_email || null,
    needs: n.needs,
    notes: n.description,
    // El detalle solo muestra fotos (no documentos/PDF como galería de imágenes).
    media: (n.media ?? []).filter((m): m is { kind: "foto"; url: string } => m.kind === "foto"),
    created_at: n.created_at,
  };
}

// Después de 48h un registro deja de mostrarse en el Marketplace (sigue
// existiendo en su tabla original, solo se oculta aquí) para que la lista
// no se llene de cosas viejas durante una emergencia que cambia rápido.
const MARKETPLACE_FRESH_MS = 48 * 60 * 60 * 1000;
function isFresh(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= MARKETPLACE_FRESH_MS;
}

// Solo casos activos (no resueltos ni descartados como falsos) y recientes
// (últimas 48h) tiene sentido mostrar como "necesidad abierta" en el marketplace.
export async function fetchNeedEntries(): Promise<NeedEntry[]> {
  const rows = await fetchNeeds();
  return rows
    .filter((n) => (n.status === "sin_verificar" || n.status === "en_proceso") && isFresh(n.created_at))
    .map(needToEntry);
}

// ── Puente con reportes mal-clasificados (tabla `reports`) ──
// Algunas personas (hospitales pidiendo insumos, centros de acopio, refugios)
// usan por error el formulario general de "Reportar" en vez de registrarse
// aquí o en Necesidades Humanitarias. Esos reportes nunca aparecían en el
// Marketplace. Detectamos los tipos que por definición SON una necesidad de
// recursos (`hospital_insumos` = "hospital necesita insumos urgentes",
// `ayuda` = "centro de ayuda/acopio") y los mostramos también en "Necesitan".
const MISFILED_NEED_REPORT_TYPES = ["hospital_insumos", "ayuda"] as const;

type MisfiledReportRow = {
  id: string;
  type: (typeof MISFILED_NEED_REPORT_TYPES)[number];
  lat: number;
  lng: number;
  place: string;
  description: string;
  reporter_name: string;
  contact_phone: string | null;
  details: Record<string, string> | null;
  media: MediaItem[] | null;
  created_at: string;
};

function misfiledReportToEntry(r: MisfiledReportRow): NeedEntry {
  const needText = r.details?.insumos?.trim() || r.description?.trim() || "";
  return {
    id: r.id,
    source: "reporte",
    name: r.reporter_name || (r.type === "hospital_insumos" ? "Hospital" : "Centro de ayuda / acopio"),
    place: r.place,
    lat: r.lat,
    lng: r.lng,
    phone: r.contact_phone,
    whatsapp: r.contact_phone,
    email: null,
    needs: [],
    notes: needText,
    media: r.media ?? [],
    created_at: r.created_at,
  };
}

export async function fetchMisfiledNeedReports(): Promise<NeedEntry[]> {
  const cutoff = new Date(Date.now() - MARKETPLACE_FRESH_MS).toISOString();
  const { data, error } = await supabase
    .from("reports")
    .select("id,type,lat,lng,place,description,reporter_name,contact_phone,details,media,created_at")
    .in("type", MISFILED_NEED_REPORT_TYPES)
    .in("status", ["sin_verificar", "verificado", "en_proceso"])
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return ((data as MisfiledReportRow[]) ?? []).map(misfiledReportToEntry);
}

// ── Queries ──
type Row = Omit<AidProvider, "offers" | "needs" | "media"> & {
  offers: string[] | null;
  needs: string[] | null;
  media: MediaItem[] | null;
};

function fromRow(r: Row): AidProvider {
  return { ...r, offers: r.offers ?? [], needs: r.needs ?? [], media: r.media ?? [] };
}

export async function fetchProviders(): Promise<AidProvider[]> {
  const cutoff = new Date(Date.now() - MARKETPLACE_FRESH_MS).toISOString();
  const PAGE = 1000;
  const all: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("aid_providers")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data as Row[]) ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all.map(fromRow);
}

export type NewProvider = {
  kind: ProviderKind;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  lat: number;
  lng: number;
  place: string;
  radius_km: number;
  offers: string[];
  needs: string[];
  quantity: string;
  availability: Availability;
  available_from: string | null;
  schedule: string;
  notes: string;
  media: MediaItem[];
};

export async function submitProvider(p: NewProvider): Promise<void> {
  const payload = {
    kind: p.kind,
    name: p.name.trim(),
    phone: p.phone.trim() || null,
    whatsapp: p.whatsapp.trim() || null,
    email: p.email.trim() || null,
    lat: p.lat,
    lng: p.lng,
    place: p.place.trim(),
    radius_km: p.radius_km,
    offers: p.offers,
    needs: p.needs,
    quantity: p.quantity.trim(),
    availability: p.availability,
    available_from: p.availability === "programada" ? p.available_from : null,
    schedule: p.schedule.trim(),
    notes: p.notes.trim(),
    media: p.media,
    status: "activo",
  };
  // Sin .select() para no chocar con RLS de lectura (mismo patrón que alert_subscriptions).
  const { error } = await supabase.from("aid_providers").insert(payload);
  if (error) throw error;
}
