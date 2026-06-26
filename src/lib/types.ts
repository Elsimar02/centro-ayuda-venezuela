export type ReportType =
  | "persona_desaparecida"
  | "persona_encontrada_viva"
  | "persona_fallecida"
  | "atrapada"
  | "colapso"
  | "bloqueo"
  | "peligro"
  | "ayuda"
  | "hospital"
  | "hospital_insumos"
  | "insumos_disponibles"
  | "refugio"
  | "agua"
  | "alimentos"
  | "electricidad"
  | "internet"
  | "mascota_perdida"
  | "mascota_encontrada";

export type Urgency = "critica" | "alta" | "media" | "baja";

export type ReportStatus =
  | "sin_verificar"
  | "verificado"
  | "en_proceso"
  | "resuelto"
  | "falso";

export type MediaItem = { kind: "foto" | "video" | "audio"; url?: string };

export type Report = {
  id: string;
  type: ReportType;
  lat: number;
  lng: number;
  place: string;
  description: string;
  urgency: Urgency;
  status: ReportStatus;
  people: number;
  confidence: number;
  vc_confirm: number;
  vc_attended: number;
  vc_incorrect: number;
  reporter_name: string;
  contact_phone: string | null;
  details: Record<string, string>;
  media: MediaItem[];
  created_at: string;
};

// ── Actualizaciones en vivo por reporte ──
export type UpdateKind =
  | "confirmacion"
  | "en_camino"
  | "trabajando"
  | "localizada"
  | "resuelto"
  | "info";

export type UpdateKindConfig = {
  label: string;
  emoji: string;
  color: string;
  hint: string;
  // Si se define, publicar esta actualización mueve el reporte a ese estado.
  setStatus?: ReportStatus;
};

export const UPDATE_KINDS: Record<UpdateKind, UpdateKindConfig> = {
  confirmacion: { label: "Lo confirmo", emoji: "✓", color: "#16a34a", hint: "Vi esto, es real" },
  en_camino: { label: "Voy en camino", emoji: "🚗", color: "#2563eb", hint: "Me dirijo al lugar" },
  trabajando: { label: "Ya se está atendiendo", emoji: "🛠️", color: "#2563eb", hint: "Hay gente trabajando aquí", setStatus: "en_proceso" },
  localizada: { label: "Persona / mascota localizada", emoji: "🟢", color: "#16a34a", hint: "Apareció · deja datos de contacto", setStatus: "resuelto" },
  resuelto: { label: "Resuelto / ya no se necesita", emoji: "✅", color: "#0d9488", hint: "Situación resuelta", setStatus: "resuelto" },
  info: { label: "Información adicional", emoji: "💬", color: "#6b7280", hint: "Aporto un dato o detalle" },
};

export type ReportUpdate = {
  id: string;
  report_id: string;
  kind: UpdateKind;
  message: string;
  author_name: string;
  author_phone: string | null;
  created_at: string;
};

export type NewUpdate = {
  kind: UpdateKind;
  message: string;
  author_name: string;
  author_phone: string;
};

export type CatConfig = { label: string; emoji: string; color: string };

export const CATS: Record<ReportType, CatConfig> = {
  persona_desaparecida: { label: "Persona desaparecida", emoji: "🔴", color: "#dc2626" },
  persona_encontrada_viva: { label: "Persona encontrada con vida", emoji: "🟢", color: "#16a34a" },
  persona_fallecida: { label: "Persona fallecida", emoji: "⚫", color: "#3f3f46" },
  atrapada: { label: "Persona atrapada (necesita rescate)", emoji: "🆘", color: "#e5484d" },
  colapso: { label: "Edificio colapsado", emoji: "🏚️", color: "#b45309" },
  bloqueo: { label: "Vía bloqueada o intransitable", emoji: "🚧", color: "#e8950c" },
  peligro: { label: "Zona de peligro (réplicas, derrumbes, cables)", emoji: "⚠️", color: "#dc2626" },
  ayuda: { label: "Centro de ayuda / acopio", emoji: "🤝", color: "#16a34a" },
  hospital: { label: "Hospital o centro de salud operativo", emoji: "🏥", color: "#2563eb" },
  hospital_insumos: { label: "Hospital necesita insumos urgentes", emoji: "🩺", color: "#2563eb" },
  insumos_disponibles: { label: "Insumos o medicinas para donar", emoji: "💉", color: "#db2777" },
  refugio: { label: "Refugio / albergue", emoji: "⛺", color: "#0d9488" },
  agua: { label: "Punto de agua potable", emoji: "💧", color: "#0ea5e9" },
  alimentos: { label: "Punto de alimentos / comedor", emoji: "🍞", color: "#d97706" },
  electricidad: { label: "Sin electricidad / cable caído (riesgo)", emoji: "⚡", color: "#ca8a04" },
  internet: { label: "Punto de wifi / carga de celular", emoji: "📶", color: "#6366f1" },
  mascota_perdida: { label: "Mascota perdida", emoji: "🐕", color: "#b45309" },
  mascota_encontrada: { label: "Mascota encontrada", emoji: "🐾", color: "#16a34a" },
};

export const PERSON_TYPES: ReportType[] = [
  "persona_desaparecida",
  "persona_encontrada_viva",
  "persona_fallecida",
];

export const PERSON_STATUS_OPTIONS: { type: ReportType; label: string; emoji: string }[] = [
  { type: "persona_desaparecida", label: "Desaparecida", emoji: "🔴" },
  { type: "persona_encontrada_viva", label: "Localizada con vida", emoji: "🟢" },
  { type: "persona_fallecida", label: "Fallecida", emoji: "⚫" },
];

export const PET_TYPES: ReportType[] = ["mascota_perdida", "mascota_encontrada"];

export const PET_STATUS_OPTIONS: { type: ReportType; label: string; emoji: string }[] = [
  { type: "mascota_perdida", label: "Perdida", emoji: "🐕" },
  { type: "mascota_encontrada", label: "Encontrada", emoji: "🐾" },
];

export const HELP_TYPES: ReportType[] = ["ayuda", "agua", "alimentos", "insumos_disponibles"];

export const HELP_SERVICE_OPTIONS: { key: string; label: string; emoji: string }[] = [
  { key: "agua", label: "Agua potable", emoji: "💧" },
  { key: "alimentos", label: "Alimentos / comida", emoji: "🍞" },
  { key: "insumos", label: "Insumos o medicinas", emoji: "💉" },
  { key: "otros", label: "Otro tipo de ayuda (ropa, voluntariado, etc.)", emoji: "🟢" },
];

export type FieldDef = { key: string; label: string; placeholder: string };

export const TYPE_FIELDS: Partial<Record<ReportType, FieldDef[]>> = {
  persona_desaparecida: [
    { key: "nombre", label: "Nombre de la persona", placeholder: "Nombre completo (si se conoce)" },
    { key: "edad", label: "Edad aproximada", placeholder: "Ej. 65 años" },
    { key: "descripcion_fisica", label: "Descripción física / ropa", placeholder: "Ej. Camisa azul, contextura delgada" },
    { key: "ultima_vez_visto", label: "Última vez vista (fecha / zona)", placeholder: "Ej. Hoy 8am, cerca de la plaza" },
  ],
  persona_encontrada_viva: [
    { key: "nombre", label: "Nombre de la persona", placeholder: "Nombre completo (si se conoce)" },
    { key: "estado_salud", label: "Estado de salud", placeholder: "Ej. Estable, con heridas leves" },
    { key: "trasladada_a", label: "¿Fue trasladada a algún lugar?", placeholder: "Ej. Hospital de Pariata" },
  ],
  persona_fallecida: [
    { key: "nombre", label: "Nombre (si se conoce)", placeholder: "Nombre completo" },
    { key: "donde_encontrada", label: "Dónde fue encontrada", placeholder: "Ej. Bajo escombros, calle X" },
    { key: "autoridad_notificada", label: "¿Ya se notificó a una autoridad?", placeholder: "Ej. Protección Civil, bomberos" },
  ],
  atrapada: [
    { key: "acceso", label: "Cómo acceder al lugar", placeholder: "Ej. Entrada por el callejón lateral" },
    { key: "se_escuchan_voces", label: "¿Se escuchan voces o señales de vida?", placeholder: "Sí / No / No estoy seguro" },
  ],
  colapso: [
    { key: "tipo_edificio", label: "Tipo de edificio", placeholder: "Ej. Vivienda, comercio, escuela" },
    { key: "pisos", label: "Pisos aproximados", placeholder: "Ej. 3 pisos" },
  ],
  bloqueo: [
    { key: "causa", label: "Causa del bloqueo", placeholder: "Ej. Derrumbe, escombros, inundación" },
    { key: "transitable_a_pie", label: "¿Se puede pasar a pie?", placeholder: "Sí / No" },
  ],
  peligro: [
    { key: "tipo_peligro", label: "Tipo de peligro", placeholder: "Ej. Riesgo de derrumbe, cables caídos" },
  ],
  ayuda: [
    { key: "horario", label: "Horario de atención", placeholder: "Ej. 8am - 5pm" },
  ],
  hospital: [
    { key: "nombre_centro", label: "Nombre del centro", placeholder: "Ej. Hospital de Pariata" },
    { key: "recibiendo_pacientes", label: "¿Está recibiendo pacientes?", placeholder: "Sí / No" },
    { key: "servicios", label: "Servicios disponibles", placeholder: "Ej. Urgencias, quirófano" },
  ],
  hospital_insumos: [
    { key: "nombre_centro", label: "Nombre del hospital", placeholder: "Ej. Hospital de Pariata" },
    { key: "insumos", label: "Insumos que faltan", placeholder: "Ej. Insulina, gasas, sangre tipo O-" },
  ],
  insumos_disponibles: [
    { key: "que_hay", label: "Qué hay disponible", placeholder: "Ej. Medicinas, gasas, suero" },
    { key: "cantidad", label: "Cantidad aproximada", placeholder: "Ej. 10 cajas" },
  ],
  refugio: [
    { key: "nombre_lugar", label: "Nombre del lugar", placeholder: "Ej. Escuela Bolivariana" },
    { key: "capacidad", label: "Capacidad disponible", placeholder: "Ej. 50 personas" },
    { key: "que_ofrece", label: "Qué ofrece", placeholder: "Ej. Camas, agua, comida" },
  ],
  agua: [
    { key: "tipo_fuente", label: "Tipo de fuente", placeholder: "Ej. Camión cisterna, pozo, botellones" },
    { key: "disponible_ahora", label: "¿Disponible ahora mismo?", placeholder: "Sí / No" },
  ],
  alimentos: [
    { key: "tipo_alimento", label: "Tipo de alimento", placeholder: "Ej. Víveres no perecederos, comida caliente" },
    { key: "para_cuantos", label: "Para cuántas personas", placeholder: "Ej. 100 personas" },
  ],
  electricidad: [
    { key: "tipo_falla", label: "Tipo de situación", placeholder: "Ej. Corte de luz, cable caído expuesto (riesgo)" },
  ],
  internet: [
    { key: "tipo_servicio", label: "Qué ofrece", placeholder: "Ej. WiFi gratis, carga de celular" },
  ],
  mascota_perdida: [
    { key: "tipo_animal", label: "Tipo de animal", placeholder: "Ej. Perro, gato" },
    { key: "descripcion", label: "Descripción (raza, color, collar)", placeholder: "Ej. Labrador color marrón, collar rojo" },
  ],
  mascota_encontrada: [
    { key: "tipo_animal", label: "Tipo de animal", placeholder: "Ej. Perro, gato" },
    { key: "descripcion", label: "Descripción (raza, color, collar)", placeholder: "Ej. Labrador color marrón, collar rojo" },
    { key: "donde_encontrada", label: "Dónde la encontraste", placeholder: "Ej. Cerca de la plaza" },
  ],
};

// Lower number = shown first (more critical / life-safety first, informational last).
export const REPORT_PRIORITY: Record<ReportType, number> = {
  atrapada: 1,
  persona_desaparecida: 2,
  persona_fallecida: 3,
  ayuda: 4,
  hospital_insumos: 5,
  peligro: 6,
  persona_encontrada_viva: 7,
  hospital: 8,
  refugio: 9,
  agua: 10,
  alimentos: 11,
  insumos_disponibles: 12,
  electricidad: 13,
  internet: 14,
  mascota_perdida: 15,
  mascota_encontrada: 16,
  colapso: 17,
  bloqueo: 18,
};

// Types where urgency level is meaningful (actionable emergencies) vs. purely
// informational reports (resource points, status updates) where it adds no value.
export const SHOW_URGENCY_TYPES = new Set<ReportType>([
  "persona_desaparecida",
  "atrapada",
  "colapso",
  "bloqueo",
  "peligro",
  "hospital_insumos",
  "electricidad",
]);

export const PEOPLE_COUNT_TYPES = new Set<ReportType>([
  "atrapada",
  "colapso",
  "bloqueo",
  "peligro",
  "persona_desaparecida",
  "persona_encontrada_viva",
  "persona_fallecida",
]);

export const STATUS: Record<ReportStatus, { label: string; color: string }> = {
  sin_verificar: { label: "Sin verificar", color: "#8b94a3" },
  verificado: { label: "Verificado", color: "#16a34a" },
  en_proceso: { label: "En proceso", color: "#2563eb" },
  resuelto: { label: "Resuelto", color: "#0d9488" },
  falso: { label: "Falso", color: "#dc2626" },
};

export const URG: Record<Urgency, { label: string; color: string; hint: string }> = {
  critica: { label: "Crítica", color: "#dc2626", hint: "Vida en peligro inmediato" },
  alta: { label: "Alta", color: "#ea580c", hint: "Requiere atención pronta" },
  media: { label: "Media", color: "#d97706", hint: "Importante, no inmediato" },
  baja: { label: "Baja", color: "#16a34a", hint: "Informativo / recurso" },
};

export type Draft = {
  type: ReportType | null;
  urgency: Urgency;
  desc: string;
  people: number;
  name: string;
  phone: string;
  loc: "gps" | "manual" | "referencia";
  manual: string;
  reference: string;
  manualCoords: { lat: number; lng: number } | null;
  referenceArea: { lat: number; lng: number; radius: number } | null;
  media: MediaItem[];
  extra: Record<string, string>;
};

export function freshDraft(): Draft {
  return {
    type: null,
    urgency: "alta",
    desc: "",
    people: 1,
    name: "",
    phone: "",
    loc: "gps",
    manualCoords: null,
    referenceArea: null,
    manual: "",
    reference: "",
    media: [],
    extra: {},
  };
}
