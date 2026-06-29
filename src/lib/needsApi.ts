import { SUPABASE_URL, supabase } from "./supabase";
import { compressImage } from "./reports";
import { NeedDraft, NeedMediaItem, NeedReport, NeedStatus } from "./needs";

export async function fetchNeeds(): Promise<NeedReport[]> {
  const PAGE = 1000;
  const all: NeedReport[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("necesidades")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data as NeedReport[]) ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

// Búsqueda/filtro para el dashboard admin: hecha server-side (en vez de cargar
// todo a memoria como `fetchNeeds`) para que escale a miles de filas.
export async function queryNeeds(opts: {
  status?: NeedStatus;
  urgency?: string;
  need?: string;
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: NeedReport[]; total: number }> {
  let q = supabase.from("necesidades").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.urgency) q = q.eq("urgency", opts.urgency);
  if (opts.need) q = q.contains("needs", [opts.need]);
  if (opts.search) {
    const s = opts.search.trim();
    if (s) q = q.or(`contact_name.ilike.%${s}%,case_number.ilike.%${s}%,direccion.ilike.%${s}%,estado.ilike.%${s}%`);
  }
  const from = (opts.page - 1) * opts.pageSize;
  const { data, error, count } = await q.range(from, from + opts.pageSize - 1);
  if (error) throw error;
  return { rows: (data as NeedReport[]) ?? [], total: count ?? 0 };
}

// Para el mapa admin y los exportes: trae TODO lo que matchea los filtros
// (sin paginar la respuesta al usuario), pero tope de 5000 para no reventar
// memoria si algún día hay decenas de miles de casos.
export async function supabaseNeedsAll(filters: {
  status?: NeedStatus;
  urgency?: string;
  need?: string;
  search?: string;
} = {}): Promise<NeedReport[]> {
  let q = supabase.from("necesidades").select("*").order("created_at", { ascending: false });
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.urgency) q = q.eq("urgency", filters.urgency);
  if (filters.need) q = q.contains("needs", [filters.need]);
  if (filters.search) {
    const s = filters.search.trim();
    if (s) q = q.or(`contact_name.ilike.%${s}%,case_number.ilike.%${s}%,direccion.ilike.%${s}%,estado.ilike.%${s}%`);
  }
  const { data, error } = await q.range(0, 4999);
  if (error) throw error;
  return (data as NeedReport[]) ?? [];
}

export async function submitNeed(d: NeedDraft): Promise<NeedReport> {
  const payload = {
    contact_name: d.contact_name.trim(),
    contact_phone: d.contact_phone.trim(),
    contact_whatsapp: d.contact_whatsapp.trim() || null,
    contact_email: d.contact_email.trim() || null,
    estado: d.estado,
    municipio: d.municipio || null,
    parroquia: d.parroquia || null,
    direccion: d.direccion || null,
    referencia: d.referencia || null,
    lat: d.lat,
    lng: d.lng,
    people_total: d.people_total,
    people_children: d.people_children,
    people_elderly: d.people_elderly,
    people_pregnant: d.people_pregnant,
    people_disabled: d.people_disabled,
    people_pets: d.people_pets,
    emergency_types: d.emergency_types,
    emergency_other: d.emergency_types.includes("otro") ? d.emergency_other || null : null,
    needs: d.needs,
    needs_other: d.needs.includes("otro") ? d.needs_other || null : null,
    urgency: d.urgency,
    description: d.description.trim(),
    media: d.media,
  };
  const { data, error } = await supabase.from("necesidades").insert(payload).select().single();
  if (error) throw error;
  return data as NeedReport;
}

export async function updateNeedStatus(id: string, status: NeedStatus) {
  const { error } = await supabase.from("necesidades").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchNeedById(id: string): Promise<NeedReport | null> {
  const { data, error } = await supabase.from("necesidades").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as NeedReport) ?? null;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadNeedFile(file: File): Promise<NeedMediaItem> {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !isPdf) throw new Error("Solo se aceptan fotos o documentos PDF.");

  if (isImage) {
    const blob = await compressImage(file, 1600, 0.72);
    const path = `needs/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage.from("report-media").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return { kind: "foto", url: `${SUPABASE_URL}/storage/v1/object/public/report-media/${path}` };
  }

  if (file.size > MAX_PDF_BYTES) throw new Error("El PDF no puede pesar más de 10MB.");
  const path = `needs/${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  const { error } = await supabase.storage.from("report-media").upload(path, file, { contentType: "application/pdf" });
  if (error) throw error;
  return { kind: "documento", url: `${SUPABASE_URL}/storage/v1/object/public/report-media/${path}`, name: file.name };
}
