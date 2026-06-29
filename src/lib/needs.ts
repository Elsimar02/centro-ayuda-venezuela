import { Urgency } from "@/lib/types";

// Modelo de datos del módulo "Necesidades Humanitarias" — registro estructurado
// de lo que necesita una familia/comunidad para sobrevivir. Reutiliza el mismo
// vocabulario de urgencia (`Urgency`/`URG`) que el resto de la app en vez de
// inventar uno nuevo, para que los colores 🔴🟠🟡🟢 sean consistentes en todas
// partes.

export type NeedMediaKind = "foto" | "documento";
export type NeedMediaItem = { kind: NeedMediaKind; url: string; name?: string };

export type NeedStatus = "sin_verificar" | "en_proceso" | "resuelto" | "falso";

export type NeedReport = {
  id: string;
  case_number: string;
  contact_name: string;
  contact_phone: string;
  contact_whatsapp: string | null;
  contact_email: string | null;
  estado: string;
  municipio: string | null;
  parroquia: string | null;
  direccion: string | null;
  referencia: string | null;
  lat: number | null;
  lng: number | null;
  people_total: number;
  people_children: number;
  people_elderly: number;
  people_pregnant: number;
  people_disabled: number;
  people_pets: number;
  emergency_types: string[];
  emergency_other: string | null;
  needs: string[];
  needs_other: string | null;
  urgency: Urgency;
  description: string;
  media: NeedMediaItem[];
  status: NeedStatus;
  created_at: string;
};

export type NeedDraft = {
  contact_name: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  estado: string;
  municipio: string;
  parroquia: string;
  direccion: string;
  referencia: string;
  lat: number | null;
  lng: number | null;
  people_total: number;
  people_children: number;
  people_elderly: number;
  people_pregnant: number;
  people_disabled: number;
  people_pets: number;
  emergency_types: string[];
  emergency_other: string;
  needs: string[];
  needs_other: string;
  urgency: Urgency;
  description: string;
  media: NeedMediaItem[];
};

export function freshNeedDraft(): NeedDraft {
  return {
    contact_name: "",
    contact_phone: "",
    contact_whatsapp: "",
    contact_email: "",
    estado: "",
    municipio: "",
    parroquia: "",
    direccion: "",
    referencia: "",
    lat: null,
    lng: null,
    people_total: 1,
    people_children: 0,
    people_elderly: 0,
    people_pregnant: 0,
    people_disabled: 0,
    people_pets: 0,
    emergency_types: [],
    emergency_other: "",
    needs: [],
    needs_other: "",
    urgency: "alta",
    description: "",
    media: [],
  };
}

export const NEED_STATUS_LABELS: Record<NeedStatus, { label: string; color: string }> = {
  sin_verificar: { label: "Sin verificar", color: "#8b94a3" },
  en_proceso: { label: "En proceso", color: "#2563eb" },
  resuelto: { label: "Resuelto", color: "#0d9488" },
  falso: { label: "Falso", color: "#dc2626" },
};

export const EMERGENCY_TYPES: { key: string; label: string }[] = [
  { key: "vivienda_perdida", label: "Perdió completamente la vivienda" },
  { key: "vivienda_inhabitable", label: "Vivienda inhabitable" },
  { key: "vivienda_parcial", label: "Vivienda parcialmente afectada" },
  { key: "persona_atrapada", label: "Persona atrapada" },
  { key: "persona_desaparecida", label: "Persona desaparecida" },
  { key: "comunidad_aislada", label: "Comunidad aislada" },
  { key: "inundacion", label: "Inundación" },
  { key: "derrumbe", label: "Derrumbe" },
  { key: "otro", label: "Otro" },
];

export const NEEDS_LIST: { key: string; label: string; emoji: string }[] = [
  { key: "agua_potable", label: "Agua potable", emoji: "💧" },
  { key: "alimentos", label: "Alimentos", emoji: "🍞" },
  { key: "leche_infantil", label: "Leche infantil", emoji: "🍼" },
  { key: "formula", label: "Fórmula", emoji: "🍼" },
  { key: "panales", label: "Pañales", emoji: "🧷" },
  { key: "medicamentos", label: "Medicamentos", emoji: "💊" },
  { key: "atencion_medica", label: "Atención médica", emoji: "🩺" },
  { key: "ambulancia", label: "Ambulancia", emoji: "🚑" },
  { key: "oxigeno", label: "Oxígeno", emoji: "🫁" },
  { key: "sillas_ruedas", label: "Sillas de ruedas", emoji: "♿" },
  { key: "muletas", label: "Muletas", emoji: "🦯" },
  { key: "carpa", label: "Carpa", emoji: "⛺" },
  { key: "colchones", label: "Colchones", emoji: "🛏️" },
  { key: "cobijas", label: "Cobijas", emoji: "🧣" },
  { key: "ropa", label: "Ropa", emoji: "👕" },
  { key: "zapatos", label: "Zapatos", emoji: "👟" },
  { key: "kits_higiene", label: "Kits de higiene", emoji: "🧼" },
  { key: "banos_portatiles", label: "Baños portátiles", emoji: "🚻" },
  { key: "cocina", label: "Cocina", emoji: "🍳" },
  { key: "gas", label: "Gas", emoji: "🔥" },
  { key: "electricidad", label: "Electricidad", emoji: "⚡" },
  { key: "generador", label: "Generador eléctrico", emoji: "🔌" },
  { key: "linternas", label: "Linternas", emoji: "🔦" },
  { key: "baterias", label: "Baterías", emoji: "🔋" },
  { key: "cargadores", label: "Cargadores", emoji: "🔌" },
  { key: "transporte", label: "Transporte", emoji: "🚐" },
  { key: "combustible", label: "Combustible", emoji: "⛽" },
  { key: "evacuacion", label: "Evacuación", emoji: "🆘" },
  { key: "alojamiento_temporal", label: "Alojamiento temporal", emoji: "🏠" },
  { key: "rescate", label: "Rescate", emoji: "🚨" },
  { key: "apoyo_psicologico", label: "Apoyo psicológico", emoji: "🧠" },
  { key: "atencion_veterinaria", label: "Atención veterinaria", emoji: "🐾" },
  { key: "alimento_mascotas", label: "Alimento para mascotas", emoji: "🐶" },
  { key: "otro", label: "Otro", emoji: "➕" },
];

export const ESTADOS_VENEZUELA: string[] = [
  "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo",
  "Cojedes", "Delta Amacuro", "Distrito Capital", "Falcón", "Guárico", "Lara",
  "La Guaira", "Mérida", "Miranda", "Monagas", "Nueva Esparta", "Portuguesa",
  "Sucre", "Táchira", "Trujillo", "Yaracuy", "Zulia",
];
