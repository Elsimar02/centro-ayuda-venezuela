"use client";

import { useId, useMemo, useState } from "react";
import {
  EMERGENCY_TYPES,
  ESTADOS_VENEZUELA,
  NEEDS_LIST,
  NeedDraft,
  NeedReport,
  freshNeedDraft,
} from "@/lib/needs";
import { URG, Urgency } from "@/lib/types";
import { submitNeed, uploadNeedFile } from "@/lib/needsApi";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { NeedsReceipt } from "@/components/NeedsReceipt";

const SECTIONS = [
  "Contacto",
  "Ubicación",
  "Personas afectadas",
  "Tipo de emergencia",
  "Necesidades",
  "Urgencia",
  "Descripción",
  "Fotos",
  "Documentos",
];

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`);
    const data = await res.json();
    const p = data?.features?.[0]?.properties;
    if (!p) return null;
    return [p.city || p.town || p.village || p.county, p.state].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

export function NeedsForm({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState<NeedDraft>(() => freshNeedDraft());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<NeedReport | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "done" | "error">("idle");

  const photos = draft.media.filter((m) => m.kind === "foto");
  const docs = draft.media.filter((m) => m.kind === "documento");

  function patch(p: Partial<NeedDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function toggleInList(key: "emergency_types" | "needs", value: string) {
    setDraft((d) => {
      const cur = d[key];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...d, [key]: next };
    });
  }

  function useGps() {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        patch({ lat, lng });
        setGpsStatus("done");
        const place = await reverseGeocode(lat, lng);
        if (place) patch({ direccion: draft.direccion || place });
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        if (isImage && photos.length >= 10) {
          setError("Máximo 10 fotos.");
          break;
        }
        if (!isImage && docs.length >= 5) {
          setError("Máximo 5 documentos.");
          break;
        }
        const item = await uploadNeedFile(file);
        setDraft((d) => ({ ...d, media: [...d.media, item] }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(url: string) {
    setDraft((d) => ({ ...d, media: d.media.filter((m) => m.url !== url) }));
  }

  async function handleAiSubmit() {
    if (aiText.trim().length < 5) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/parse-need", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error || "Error");
      setDraft((d) => ({
        ...d,
        contact_name: parsed.contact_name || d.contact_name,
        contact_phone: parsed.contact_phone || d.contact_phone,
        estado: parsed.estado || d.estado,
        direccion: parsed.direccion || d.direccion,
        people_total: parsed.people_total || d.people_total,
        people_children: parsed.people_children ?? d.people_children,
        people_elderly: parsed.people_elderly ?? d.people_elderly,
        emergency_types: parsed.emergency_types?.length ? parsed.emergency_types : d.emergency_types,
        needs: parsed.needs?.length ? parsed.needs : d.needs,
        urgency: (parsed.urgency as Urgency) || d.urgency,
        description: parsed.description || d.description,
      }));
      setShowAi(false);
      setAiText("");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "No se pudo procesar el texto.");
    } finally {
      setAiLoading(false);
    }
  }

  const hasMinimum = draft.contact_name.trim().length > 0 && draft.contact_phone.trim().length > 0 && draft.estado;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const row = await submitNeed(draft);
      setCreated(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el registro. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return <NeedsReceipt need={created} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <div className="text-sm font-extrabold leading-tight">NECESIDADES HUMANITARIAS</div>
          <div className="hidden text-xs sm:block" style={{ color: "var(--muted)" }}>
            Registra las necesidades de una familia o comunidad afectada.
          </div>
        </div>
        <button type="button" onClick={onClose} className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold" style={{ borderColor: "var(--border)" }}>
          ✕ Cerrar
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-52 flex-shrink-0 flex-col gap-1 overflow-y-auto p-4 md:flex" style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}>
          {SECTIONS.map((s, i) => (
            <a
              key={s}
              href={`#need-section-${i}`}
              className="rounded-lg px-3 py-2 text-xs font-bold"
              style={{ color: "var(--fg-2)" }}
            >
              {i + 1}. {s}
            </a>
          ))}
        </aside>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 sm:p-6">
            <button
              type="button"
              onClick={() => setShowAi(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm font-extrabold"
              style={{ borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <span className="text-lg">✨</span>
              Extraer automáticamente desde un mensaje de WhatsApp
            </button>

            <Section index={0} title="Información de contacto">
              <Field label="Nombre completo" placeholder="Nombre y apellido" value={draft.contact_name} onChange={(v) => patch({ contact_name: v })} />
              <Field label="Teléfono" placeholder="Ej. 0412-1234567" value={draft.contact_phone} onChange={(v) => patch({ contact_phone: v })} />
              <Field label="WhatsApp (opcional)" placeholder="Si es distinto al teléfono" value={draft.contact_whatsapp} onChange={(v) => patch({ contact_whatsapp: v })} />
              <Field label="Correo electrónico (opcional)" placeholder="correo@ejemplo.com" value={draft.contact_email} onChange={(v) => patch({ contact_email: v })} />
            </Section>

            <Section index={1} title="Ubicación">
              <div>
                <label className="mb-1.5 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>Estado</label>
                <select
                  value={draft.estado}
                  onChange={(e) => patch({ estado: e.target.value })}
                  className="h-12 w-full rounded-xl border px-3.5 text-sm outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <option value="">Selecciona un estado</option>
                  {ESTADOS_VENEZUELA.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <Field label="Municipio" placeholder="Municipio" value={draft.municipio} onChange={(v) => patch({ municipio: v })} />
              <Field label="Parroquia" placeholder="Parroquia" value={draft.parroquia} onChange={(v) => patch({ parroquia: v })} />
              <div>
                <label className="mb-1.5 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>Dirección</label>
                <AddressAutocomplete
                  value={draft.direccion}
                  onChange={(v) => patch({ direccion: v })}
                  onPick={(s) => patch({ direccion: s.label, lat: s.lat, lng: s.lng })}
                  placeholder="Calle, sector, edificio…"
                />
              </div>
              <Field label="Referencia" placeholder='Ej. "cerca de la plaza"' value={draft.referencia} onChange={(v) => patch({ referencia: v })} />
              <button
                type="button"
                onClick={useGps}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold"
                style={{ borderColor: "var(--border)" }}
              >
                📍 {gpsStatus === "locating" ? "Obteniendo ubicación…" : gpsStatus === "done" ? "Ubicación obtenida ✓" : gpsStatus === "error" ? "No se pudo obtener — intenta de nuevo" : "Obtener ubicación GPS"}
              </button>
              {draft.lat != null && draft.lng != null && (
                <NeedsLocationPreview lat={draft.lat} lng={draft.lng} />
              )}
            </Section>

            <Section index={2} title="Personas afectadas">
              <Counter label="Número total" value={draft.people_total} min={1} onChange={(v) => patch({ people_total: v })} />
              <Counter label="Niños" value={draft.people_children} onChange={(v) => patch({ people_children: v })} />
              <Counter label="Adultos mayores" value={draft.people_elderly} onChange={(v) => patch({ people_elderly: v })} />
              <Counter label="Embarazadas" value={draft.people_pregnant} onChange={(v) => patch({ people_pregnant: v })} />
              <Counter label="Personas con discapacidad" value={draft.people_disabled} onChange={(v) => patch({ people_disabled: v })} />
              <Counter label="Mascotas" value={draft.people_pets} onChange={(v) => patch({ people_pets: v })} />
            </Section>

            <Section index={3} title="Tipo de emergencia">
              <CheckboxGrid
                options={EMERGENCY_TYPES}
                selected={draft.emergency_types}
                onToggle={(k) => toggleInList("emergency_types", k)}
              />
              {draft.emergency_types.includes("otro") && (
                <Field label="Especifica" placeholder="Describe la emergencia" value={draft.emergency_other} onChange={(v) => patch({ emergency_other: v })} />
              )}
            </Section>

            <Section index={4} title="Necesidades">
              <CheckboxGrid
                options={NEEDS_LIST}
                selected={draft.needs}
                onToggle={(k) => toggleInList("needs", k)}
              />
              {draft.needs.includes("otro") && (
                <Field label="Especifica" placeholder="¿Qué más se necesita?" value={draft.needs_other} onChange={(v) => patch({ needs_other: v })} />
              )}
            </Section>

            <Section index={5} title="Nivel de urgencia">
              <div className="flex flex-col gap-2">
                {(Object.entries(URG) as [Urgency, typeof URG[Urgency]][]).map(([id, u]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => patch({ urgency: id })}
                    className="flex items-center gap-3 rounded-2xl border p-3.5 text-left"
                    style={{
                      background: draft.urgency === id ? "var(--accent-soft)" : "var(--surface-2)",
                      borderColor: draft.urgency === id ? "var(--accent)" : "var(--border)",
                    }}
                  >
                    <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full" style={{ background: u.color }} />
                    <span className="flex-1">
                      <span className="block text-sm font-extrabold">{u.label}</span>
                      <span className="block text-xs" style={{ color: "var(--muted)" }}>{u.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Section>

            <Section index={6} title="Descripción">
              <textarea
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Describe la situación con el mayor detalle posible…"
                className="h-36 w-full resize-none rounded-2xl border p-3 text-sm outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
              />
            </Section>

            <Section index={7} title="Fotos (opcional, hasta 10)">
              <FileDrop accept="image/*" multiple disabled={uploading || photos.length >= 10} onFiles={handleFiles} label={uploading ? "Subiendo…" : "📷 Subir fotos"} />
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {photos.map((m) => (
                    <div key={m.url} className="relative aspect-square overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeMedia(m.url)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white">×</button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section index={8} title="Documentos (opcional, PDF)">
              <FileDrop accept="application/pdf" multiple disabled={uploading || docs.length >= 5} onFiles={handleFiles} label={uploading ? "Subiendo…" : "📄 Subir PDF"} />
              {docs.length > 0 && (
                <div className="flex flex-col gap-2">
                  {docs.map((m) => (
                    <div key={m.url} className="flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold" style={{ borderColor: "var(--border)" }}>
                      <span>📄</span>
                      <span className="flex-1 truncate">{m.name || "Documento"}</span>
                      <button type="button" onClick={() => removeMedia(m.url)} style={{ color: "var(--muted)" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {error && <p className="text-xs font-bold text-red-500">{error}</p>}

            <button
              type="button"
              disabled={!hasMinimum}
              onClick={() => setShowPreview(true)}
              className="h-12 rounded-2xl font-extrabold text-white disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              Revisar y enviar
            </button>
          </div>
        </div>
      </div>

      {showAi && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="flex w-full max-w-md flex-col gap-3 rounded-3xl p-5" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold" style={{ color: "var(--accent)" }}>✨ Extraer desde mensaje</div>
              <button type="button" onClick={() => setShowAi(false)} className="text-xl" style={{ color: "var(--muted)" }}>×</button>
            </div>
            <textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Pega aquí el mensaje de WhatsApp o redes…"
              className="h-32 w-full resize-none rounded-xl border p-2.5 text-sm outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            />
            <button
              type="button"
              onClick={handleAiSubmit}
              disabled={aiLoading || aiText.trim().length < 5}
              className="h-11 rounded-xl text-sm font-extrabold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {aiLoading ? "Analizando…" : "✨ Completar formulario"}
            </button>
            {aiError && <p className="text-xs font-bold text-red-500">{aiError}</p>}
          </div>
        </div>
      )}

      {showPreview && (
        <NeedsPreviewModal
          draft={draft}
          submitting={submitting}
          onClose={() => setShowPreview(false)}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
}

function Section({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div id={`need-section-${index}`} className="flex flex-col gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="text-sm font-extrabold" style={{ color: "var(--fg)" }}>{index + 1}. {title}</div>
      {children}
    </div>
  );
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border px-3.5 text-sm outline-none"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
      />
    </div>
  );
}

function Counter({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold" style={{ color: "var(--fg-2)" }}>{label}</span>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="h-9 w-9 rounded-lg border text-base" style={{ borderColor: "var(--border)" }}>−</button>
        <span className="w-6 text-center text-sm font-extrabold">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(999, value + 1))} className="h-9 w-9 rounded-lg border text-base" style={{ borderColor: "var(--border)" }}>+</button>
      </div>
    </div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
}: {
  options: { key: string; label: string; emoji?: string }[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const checked = selected.includes(o.key);
        return (
          <button
            type="button"
            key={o.key}
            onClick={() => onToggle(o.key)}
            className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold"
            style={{
              background: checked ? "var(--accent-soft)" : "var(--surface-2)",
              borderColor: checked ? "var(--accent)" : "var(--border)",
            }}
          >
            <span
              className="flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-md border text-[10px]"
              style={{ borderColor: checked ? "var(--accent)" : "var(--border)", background: checked ? "var(--accent)" : "transparent", color: "#fff" }}
            >
              {checked ? "✓" : ""}
            </span>
            {o.emoji ? `${o.emoji} ` : ""}{o.label}
          </button>
        );
      })}
    </div>
  );
}

function FileDrop({
  accept,
  multiple,
  disabled,
  label,
  onFiles,
}: {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  label: string;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-sm font-bold"
      style={{ borderColor: "var(--border)", color: disabled ? "var(--muted)" : "var(--fg-2)", opacity: disabled ? 0.6 : 1 }}
    >
      <input type="file" accept={accept} multiple={multiple} disabled={disabled} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      {label}
    </label>
  );
}

function NeedsLocationPreview({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border p-3 text-xs font-bold" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      📍 {lat.toFixed(5)}, {lng.toFixed(5)}
    </div>
  );
}

function NeedsPreviewModal({
  draft,
  submitting,
  onClose,
  onConfirm,
}: {
  draft: NeedDraft;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const emergencyLabels = useMemo(
    () => draft.emergency_types.map((k) => EMERGENCY_TYPES.find((e) => e.key === k)?.label || k),
    [draft.emergency_types]
  );
  const needLabels = useMemo(
    () => draft.needs.map((k) => NEEDS_LIST.find((n) => n.key === k)?.label || k),
    [draft.needs]
  );
  const u = URG[draft.urgency];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl" style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-extrabold">Revisar antes de enviar</h2>
          <button type="button" onClick={onClose} className="text-xl" style={{ color: "var(--muted)" }}>×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-3 text-sm">
            <div><span className="font-bold">Contacto:</span> {draft.contact_name} · {draft.contact_phone}</div>
            <div><span className="font-bold">Ubicación:</span> {[draft.direccion, draft.parroquia, draft.municipio, draft.estado].filter(Boolean).join(", ") || "No especificada"}</div>
            <div><span className="font-bold">Personas:</span> {draft.people_total} (niños: {draft.people_children}, adultos mayores: {draft.people_elderly})</div>
            <div><span className="font-bold">Emergencia:</span> {emergencyLabels.join(", ") || "—"}</div>
            <div><span className="font-bold">Necesidades:</span> {needLabels.join(", ") || "—"}</div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Urgencia:</span>
              <span className="h-3 w-3 rounded-full" style={{ background: u.color }} />
              {u.label}
            </div>
            <div><span className="font-bold">Descripción:</span> {draft.description || "—"}</div>
            <div><span className="font-bold">Adjuntos:</span> {draft.media.length} archivo(s)</div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border text-sm font-bold" style={{ borderColor: "var(--border)" }}>
            Editar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="h-11 flex-1 rounded-xl text-sm font-extrabold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {submitting ? "Enviando…" : "Confirmar y enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
