import { SUPABASE_URL, supabase } from "./supabase";
import { Draft, MediaItem, Report } from "./types";

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

function placeFor(d: Draft, scenarioCity: string): string {
  if (d.loc === "manual" && d.manual) return d.manual;
  if (d.loc === "referencia" && d.reference) return d.reference;
  return "Tu ubicación GPS · " + scenarioCity;
}

export async function submitReport(d: Draft, scenarioCity: string) {
  const coords = d.loc === "manual" && d.manualCoords ? d.manualCoords : null;
  const payload = {
    type: d.type || "ayuda",
    lat: coords?.lat ?? 10.606 + (Math.random() - 0.5) * 0.05,
    lng: coords?.lng ?? -66.915 + (Math.random() - 0.5) * 0.07,
    place: placeFor(d, scenarioCity),
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
    details: d.extra || {},
    media: d.media,
  };
  const { data, error } = await supabase.from("reports").insert(payload).select().single();
  if (error) throw error;
  return fromRow(data as ReportRow);
}

export async function verifyReport(
  report: Report,
  kind: "confirm" | "attended" | "incorrect"
) {
  const vc_confirm = report.vc_confirm + (kind === "confirm" ? 1 : 0);
  const vc_attended = report.vc_attended + (kind === "attended" ? 1 : 0);
  const vc_incorrect = report.vc_incorrect + (kind === "incorrect" ? 1 : 0);
  let confidence = report.confidence;
  let status = report.status;
  if (kind === "confirm") confidence = Math.min(99, confidence + 6);
  if (kind === "attended") {
    confidence = Math.min(99, confidence + 3);
    status = "en_proceso";
  }
  if (kind === "incorrect") confidence = Math.max(2, confidence - 12);

  const { error } = await supabase
    .from("reports")
    .update({ vc_confirm, vc_attended, vc_incorrect, confidence, status })
    .eq("id", report.id);
  if (error) throw error;
  return { vc_confirm, vc_attended, vc_incorrect, confidence, status };
}

export async function moderateReport(
  report: Report,
  action: "verify" | "false" | "delete"
) {
  if (action === "delete") {
    const { error } = await supabase.from("reports").delete().eq("id", report.id);
    if (error) throw error;
    const paths = report.media.map((m) => m.url && storagePath(m.url)).filter(Boolean) as string[];
    for (const p of paths) {
      await supabase.storage.from("report-media").remove([p]).catch(() => {});
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

