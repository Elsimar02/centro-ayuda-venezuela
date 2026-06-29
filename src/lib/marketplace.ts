import { supabase } from "./supabase";
import { fetchNeeds } from "./needsApi";
import { NEEDS_LIST, NeedReport } from "./needs";

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
  | "otros";

export type Resource = { key: string; label: string; emoji: string; group: ResourceGroup };

export const RESOURCE_GROUPS: { id: ResourceGroup; label: string; emoji: string }[] = [
  { id: "suministros", label: "Suministros", emoji: "📦" },
  { id: "refugio", label: "Refugio y espacio", emoji: "⛺" },
  { id: "transporte", label: "Transporte y logística", emoji: "🚚" },
  { id: "energia", label: "Energía e infraestructura", emoji: "⚡" },
  { id: "personal_medico", label: "Personal médico", emoji: "🩺" },
  { id: "personal_tecnico", label: "Personal técnico y rescate", emoji: "🛠️" },
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
  source: "necesidad";
  name: string;
  place: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  needs: string[]; // claves de NEEDS_LIST
  notes: string;
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
    created_at: n.created_at,
  };
}

// Solo casos activos (no resueltos ni descartados como falsos) tiene sentido
// mostrar como "necesidad abierta" en el marketplace.
export async function fetchNeedEntries(): Promise<NeedEntry[]> {
  const rows = await fetchNeeds();
  return rows.filter((n) => n.status === "sin_verificar" || n.status === "en_proceso").map(needToEntry);
}

// ── Queries ──
type Row = Omit<AidProvider, "offers" | "needs"> & { offers: string[] | null; needs: string[] | null };

function fromRow(r: Row): AidProvider {
  return { ...r, offers: r.offers ?? [], needs: r.needs ?? [] };
}

export async function fetchProviders(): Promise<AidProvider[]> {
  const PAGE = 1000;
  const all: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("aid_providers")
      .select("*")
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
    status: "activo",
  };
  // Sin .select() para no chocar con RLS de lectura (mismo patrón que alert_subscriptions).
  const { error } = await supabase.from("aid_providers").insert(payload);
  if (error) throw error;
}
