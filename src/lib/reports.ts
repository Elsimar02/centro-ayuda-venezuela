import { SUPABASE_URL, supabase } from "./supabase";
import { CONFIRM_THRESHOLD, Draft, MediaItem, NewUpdate, Report, ReportUpdate, RESOLVE_THRESHOLD, UPDATE_KINDS } from "./types";

type ReportRow = {
  id: string;
  type: Report["type"];
  lat: number;
  lng: number;
  place: string;
  description: string;
  urgency: Report["urgency"];
  status: Report["status"];
  people: number;
  confidence: number;
  vc_confirm: number;
  vc_attended: number;
  vc_incorrect: number;
  vc_resolved: number;
  reporter_name: string;
  contact_phone: string | null;
  details: Record<string, string> | null;
  media: MediaItem[] | null;
  created_at: string;
};

function fromRow(row: ReportRow): Report {
  return {
    id: row.id,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    place: row.place,
    description: row.description,
    urgency: row.urgency,
    status: row.status,
    people: row.people,
    confidence: row.confidence,
    vc_confirm: row.vc_confirm,
    vc_attended: row.vc_attended,
    vc_incorrect: row.vc_incorrect,
    vc_resolved: row.vc_resolved,
    reporter_name: row.reporter_name,
    contact_phone: row.contact_phone,
    details: row.details || {},
    media: row.media || [],
    created_at: row.created_at,
  };
}

export async function fetchReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data as ReportRow[]).map(fromRow);
}

function placeFor(d: Draft): string {
  if (d.loc === "manual" && d.manual) return d.manual;
  if (d.loc === "referencia" && d.reference) {
    return d.referenceArea ? `${d.reference} (radio aprox. ${Math.round(d.referenceArea.radius)} m)` : d.reference;
  }
  if (d.loc === "gps" && d.gpsCoords) {
    return "Tu ubicación GPS · " + (d.gpsPlace || `${d.gpsCoords.lat.toFixed(4)}, ${d.gpsCoords.lng.toFixed(4)}`);
  }
  return "Ubicación no especificada";
}

export async function submitReport(d: Draft) {
  const coords =
    d.loc === "manual" && d.manualCoords
      ? d.manualCoords
      : d.loc === "referencia" && d.referenceArea
        ? d.referenceArea
        : d.loc === "gps" && d.gpsCoords
          ? d.gpsCoords
          : null;
  if (!coords) throw new Error("No se pudo determinar la ubicación del reporte.");
  const payload = {
    type: d.type || "ayuda",
    lat: coords.lat,
    lng: coords.lng,
    place: placeFor(d),
    description: d.desc || "(Sin descripción)",
    urgency: d.urgency,
    status: "sin_verificar",
    people: d.people,
    confidence: 20,
    vc_confirm: 0,
    vc_attended: 0,
    vc_incorrect: 0,
    reporter_name: d.name || "Tú",
    contact_phone: d.phone || null,
    details: {
      ...(d.extra || {}),
      ...(d.loc === "referencia" && d.referenceArea
        ? { _approx_radius_m: String(Math.round(d.referenceArea.radius)) }
        : {}),
    },
    media: d.media,
  };
  const { data, error } = await supabase.from("reports").insert(payload).select().single();
  if (error) throw error;
  return fromRow(data as ReportRow);
}

// ── Actualizaciones en vivo por reporte ──

export async function fetchUpdates(reportId: string): Promise<ReportUpdate[]> {
  const { data, error } = await supabase
    .from("report_updates")
    .select("*")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as ReportUpdate[];
}

export async function addUpdate(reportId: string, u: NewUpdate): Promise<ReportUpdate> {
  const payload = {
    report_id: reportId,
    kind: u.kind,
    message: u.message.trim(),
    author_name: u.author_name.trim() || "Anónimo",
    author_phone: u.author_phone.trim() || null,
  };
  const { data, error } = await supabase
    .from("report_updates")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;

  // Algunas actualizaciones mueven el estado del reporte (y por realtime, el
  // mapa de todos). Best-effort: si falla, la actualización ya quedó guardada.
  const setStatus = UPDATE_KINDS[u.kind].setStatus;
  if (setStatus) {
    await supabase.from("reports").update({ status: setStatus }).eq("id", reportId).then(undefined, () => {});
  }

  return data as ReportUpdate;
}

export async function verifyReport(
  report: Report,
  kind: "confirm" | "attended" | "incorrect" | "resolved"
) {
  const vc_confirm = report.vc_confirm + (kind === "confirm" ? 1 : 0);
  const vc_attended = report.vc_attended + (kind === "attended" ? 1 : 0);
  const vc_incorrect = report.vc_incorrect + (kind === "incorrect" ? 1 : 0);
  const vc_resolved = report.vc_resolved + (kind === "resolved" ? 1 : 0);
  let confidence = report.confidence;
  let status = report.status;
  if (kind === "confirm") {
    confidence = Math.min(99, confidence + 6);
    // 5+ confirmaciones ciudadanas verifican el reporte automáticamente,
    // siempre que siga "sin verificar" (no pisar falso/en proceso/resuelto).
    if (vc_confirm >= CONFIRM_THRESHOLD && status === "sin_verificar") status = "verificado";
  }
  if (kind === "attended") {
    confidence = Math.min(99, confidence + 3);
    status = "en_proceso";
  }
  if (kind === "incorrect") confidence = Math.max(2, confidence - 12);
  if (kind === "resolved" && vc_resolved >= RESOLVE_THRESHOLD) status = "resuelto";

  const { error } = await supabase
    .from("reports")
    .update({ vc_confirm, vc_attended, vc_incorrect, vc_resolved, confidence, status })
    .eq("id", report.id);
  if (error) throw error;
  return { vc_confirm, vc_attended, vc_incorrect, vc_resolved, confidence, status };
}

export async function moderateReport(
  report: Report,
  action: "verify" | "false" | "delete"
) {
  if (action === "delete") {
    if (report.vc_resolved < RESOLVE_THRESHOLD) {
      throw new Error(
        `No se puede eliminar: necesita más de 7 confirmaciones de que está resuelto (lleva ${report.vc_resolved}).`
      );
    }
    // La política de RLS también exige vc_resolved > 7 — .select() nos deja
    // confirmar que de verdad borró algo y no quedó bloqueado en silencio.
    const { data, error } = await supabase.from("reports").delete().eq("id", report.id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("No se pudo eliminar el reporte (bloqueado por la base de datos).");
    }
    const paths = report.media.flatMap((m) => {
      const p = m.url && storagePath(m.url);
      return p ? [p] : [];
    });
    if (paths.length > 0) {
      await supabase.storage.from("report-media").remove(paths).catch(() => {});
    }
    return;
  }
  const status: Report["status"] = action === "verify" ? "verificado" : "falso";
  const confidence = action === "verify" ? Math.max(report.confidence, 85) : 12;
  const { error } = await supabase.from("reports").update({ status, confidence }).eq("id", report.id);
  if (error) throw error;
  return { status, confidence };
}

function storagePath(url: string): string | null {
  const marker = "/object/public/report-media/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

function compressImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height >= width && height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("No se pudo comprimir la imagen"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagen inválida"));
    };
    img.src = url;
  });
}

// Comprimimos en el navegador: una foto de celular (3-5MB) baja a ~100-300KB.
// El plan gratuito de Supabase Storage es limitado, esto multiplica por cada reporte.
export async function uploadPhoto(file: File): Promise<string> {
  const blob = await compressImage(file, 1600, 0.72);
  const path = `reports/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from("report-media").upload(path, blob, {
    contentType: "image/jpeg",
  });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/report-media/${path}`;
}

