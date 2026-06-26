"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import {
  CATS,
  Draft,
  HELP_SERVICE_OPTIONS,
  HELP_TYPES,
  PEOPLE_COUNT_TYPES,
  PERSON_STATUS_OPTIONS,
  PERSON_TYPES,
  PET_STATUS_OPTIONS,
  PET_TYPES,
  REPORT_PRIORITY,
  ReportType,
  SHOW_URGENCY_TYPES,
  TYPE_FIELDS,
  URG,
  Urgency,
  freshDraft,
} from "@/lib/types";

const PERSON_CARD = { label: "Persona (desaparecida, localizada o fallecida)", emoji: "🧍" };
const PET_CARD = { label: "Mascota (perdida o encontrada)", emoji: "🐾" };
const HELP_CARD = { label: "Centro de ayuda (agua, alimentos, insumos)", emoji: "🤝" };

const PERSON_PRIORITY = Math.min(...PERSON_TYPES.map((t) => REPORT_PRIORITY[t]));
const PET_PRIORITY = Math.min(...PET_TYPES.map((t) => REPORT_PRIORITY[t]));
const HELP_PRIORITY = Math.min(...HELP_TYPES.map((t) => REPORT_PRIORITY[t]));

type TypeCard = { key: string; emoji: string; label: string; priority: number; onPick: () => void; isActive: (t: ReportType | null) => boolean };
import { uploadPhoto } from "@/lib/reports";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

const RadiusPicker = dynamic(() => import("@/components/RadiusPicker"), { ssr: false });

const STEPS = ["¿Qué ocurre?", "Ubicación", "Detalles", "Urgencia", "Revisar y enviar"];

export function ReportForm({
  scenarioCity,
  onSubmit,
  onClose,
}: {
  scenarioCity: string;
  onSubmit: (draft: Draft) => Promise<{ id: string }>;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => freshDraft());
  const [uploading, setUploading] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cat = draft.type ? CATS[draft.type] : null;
  const showPeople = draft.type ? PEOPLE_COUNT_TYPES.has(draft.type) : false;
  const showUrgency = draft.type ? SHOW_URGENCY_TYPES.has(draft.type) : false;
  const extraFields = draft.type ? TYPE_FIELDS[draft.type] || [] : [];

  function back() {
    if (step === 0) return onClose();
    setStep((s) => s - 1);
  }

  async function next() {
    if (step === 0 && !draft.type) return;
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    try {
      setError(null);
      const finalDraft = showUrgency ? draft : { ...draft, urgency: "baja" as const };
      const created = await onSubmit(finalDraft);
      setSentId(created.id);
    } catch {
      setError("No se pudo enviar el reporte. Intenta de nuevo.");
    }
  }

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setDraft((d) => ({ ...d, media: [...d.media, { kind: "foto", url }] }));
    } catch {
      setError("No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  if (sentId) {
    return (
      <Modal>
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="text-4xl">✓</div>
          <h2 className="text-lg font-extrabold">Reporte enviado</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Folio {sentId}. Gracias por colaborar.
          </p>
          <button type="button"
            onClick={onClose}
            className="mt-3 h-11 rounded-xl px-5 font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            Ver en el mapa
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <button type="button" onClick={back} className="text-xl" aria-label="Atrás">‹</button>
        <h2 className="font-extrabold">Nuevo reporte</h2>
        <button type="button" onClick={onClose} className="text-xl" aria-label="Cerrar">×</button>
      </div>
      <div className="px-5 pt-3">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--accent)" : "var(--surface-3)" }}
            />
          ))}
        </div>
        <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Paso {step + 1} de 5 · {STEPS[step]}
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {(() => {
              const cards: TypeCard[] = [
                {
                  key: "persona",
                  emoji: PERSON_CARD.emoji,
                  label: PERSON_CARD.label,
                  priority: PERSON_PRIORITY,
                  onPick: () => setDraft((d) => ({ ...d, type: PERSON_TYPES.includes(d.type as ReportType) ? d.type : "persona_desaparecida" })),
                  isActive: (t: ReportType | null) => !!t && PERSON_TYPES.includes(t),
                },
                {
                  key: "mascota",
                  emoji: PET_CARD.emoji,
                  label: PET_CARD.label,
                  priority: PET_PRIORITY,
                  onPick: () => setDraft((d) => ({ ...d, type: PET_TYPES.includes(d.type as ReportType) ? d.type : "mascota_perdida" })),
                  isActive: (t: ReportType | null) => !!t && PET_TYPES.includes(t),
                },
                {
                  key: "ayuda_centro",
                  emoji: HELP_CARD.emoji,
                  label: HELP_CARD.label,
                  priority: HELP_PRIORITY,
                  onPick: () => setDraft((d) => ({ ...d, type: HELP_TYPES.includes(d.type as ReportType) ? d.type : "ayuda" })),
                  isActive: (t: ReportType | null) => !!t && HELP_TYPES.includes(t),
                },
                ...Object.entries(CATS)
                  .filter(
                    ([id]) =>
                      !PERSON_TYPES.includes(id as ReportType) &&
                      !PET_TYPES.includes(id as ReportType) &&
                      !HELP_TYPES.includes(id as ReportType)
                  )
                  .map(([id, c]) => ({
                    key: id,
                    emoji: c.emoji,
                    label: c.label,
                    priority: REPORT_PRIORITY[id as ReportType],
                    onPick: () => setDraft((d) => ({ ...d, type: id as ReportType })),
                    isActive: (t: ReportType | null) => t === id,
                  })),
              ].sort((a, b) => a.priority - b.priority);

              return cards.map((card) => (
                <button type="button"
                  key={card.key}
                  onClick={card.onPick}
                  className="flex min-h-[92px] w-full flex-col items-center gap-2 rounded-2xl border p-4 text-center"
                  style={{
                    background: card.isActive(draft.type) ? "var(--accent-soft)" : "var(--surface-2)",
                    borderColor: card.isActive(draft.type) ? "var(--accent)" : "var(--border)",
                  }}
                >
                  <span className="text-2xl">{card.emoji}</span>
                  <span className="block w-full whitespace-normal break-words text-xs font-bold leading-tight">
                    {card.label}
                  </span>
                </button>
              ));
            })()}
          </div>
        )}

        {step === 1 && (
          <LocationStep draft={draft} setDraft={setDraft} />
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {draft.type && PERSON_TYPES.includes(draft.type) && (
              <div>
                <label className="mb-2 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                  Estado de la persona
                </label>
                <div className="flex flex-col gap-2">
                  {PERSON_STATUS_OPTIONS.map((opt) => (
                    <button type="button"
                      key={opt.type}
                      onClick={() => setDraft((d) => ({ ...d, type: opt.type }))}
                      className="flex items-center gap-3 rounded-2xl border p-3.5 text-left"
                      style={{
                        background: draft.type === opt.type ? "var(--accent-soft)" : "var(--surface-2)",
                        borderColor: draft.type === opt.type ? "var(--accent)" : "var(--border)",
                      }}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="text-sm font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {draft.type && PET_TYPES.includes(draft.type) && (
              <div>
                <label className="mb-2 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                  Estado de la mascota
                </label>
                <div className="flex flex-col gap-2">
                  {PET_STATUS_OPTIONS.map((opt) => (
                    <button type="button"
                      key={opt.type}
                      onClick={() => setDraft((d) => ({ ...d, type: opt.type }))}
                      className="flex items-center gap-3 rounded-2xl border p-3.5 text-left"
                      style={{
                        background: draft.type === opt.type ? "var(--accent-soft)" : "var(--surface-2)",
                        borderColor: draft.type === opt.type ? "var(--accent)" : "var(--border)",
                      }}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="text-sm font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {draft.type && HELP_TYPES.includes(draft.type) && (
              <div>
                <label className="mb-2 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                  ¿Qué hay disponible?
                </label>
                <div className="flex flex-col gap-2">
                  {HELP_SERVICE_OPTIONS.map((opt) => {
                    const selected = (draft.extra.servicios || "").split(",").filter(Boolean);
                    const checked = selected.includes(opt.key);
                    return (
                      <button type="button"
                        key={opt.key}
                        onClick={() =>
                          setDraft((d) => {
                            const cur = (d.extra.servicios || "").split(",").filter(Boolean);
                            const next = checked ? cur.filter((k) => k !== opt.key) : [...cur, opt.key];
                            return { ...d, type: "ayuda", extra: { ...d.extra, servicios: next.join(",") } };
                          })
                        }
                        className="flex items-center gap-3 rounded-2xl border p-3.5 text-left"
                        style={{
                          background: checked ? "var(--accent-soft)" : "var(--surface-2)",
                          borderColor: checked ? "var(--accent)" : "var(--border)",
                        }}
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        <span className="text-sm font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {extraFields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                placeholder={f.placeholder}
                value={draft.extra[f.key] || ""}
                onChange={(v) => setDraft((d) => ({ ...d, extra: { ...d.extra, [f.key]: v } }))}
              />
            ))}

            <div>
              <div className="mb-1.5 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                Describe la situación
              </div>
              <textarea
                value={draft.desc}
                aria-label="Describe la situación"
                onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))}
                placeholder="Ej. Hay personas atrapadas bajo escombros en una vivienda de 2 pisos."
                className="h-28 w-full resize-none rounded-2xl border p-3 text-sm outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
              />
            </div>

            {showPeople && (
              <div>
                <label className="mb-2 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                  Personas afectadas (aprox.)
                </label>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setDraft((d) => ({ ...d, people: Math.max(0, d.people - 1) }))}
                    className="h-11 w-11 rounded-xl border text-lg"
                    style={{ borderColor: "var(--border)" }}
                  >
                    −
                  </button>
                  <div className="flex-1 text-center text-2xl font-extrabold">{draft.people}</div>
                  <button type="button"
                    onClick={() => setDraft((d) => ({ ...d, people: Math.min(999, d.people + 1) }))}
                    className="h-11 w-11 rounded-xl border text-lg"
                    style={{ borderColor: "var(--border)" }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                Adjuntar foto (opcional)
              </label>
              <label
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-dashed p-4 text-xs font-bold"
                style={{ borderColor: "var(--border)", color: "var(--fg-2)" }}
              >
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                />
                <span className="text-xl">📷</span>
                {uploading ? "Subiendo…" : "Foto"}
              </label>
              {draft.media.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {draft.media.map((m, i) => (
                    <span
                      key={i}
                      className="rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      📷 Foto
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            {showUrgency && (
              <div>
                <label className="mb-2.5 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                  Nivel de urgencia
                </label>
                <div className="flex flex-col gap-2">
                  {(Object.entries(URG) as [Urgency, typeof URG[Urgency]][]).map(([id, u]) => (
                    <button type="button"
                      key={id}
                      onClick={() => setDraft((d) => ({ ...d, urgency: id }))}
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
              </div>
            )}
            <Field label="Tu nombre (opcional)" placeholder="Tu nombre" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
            <Field label="Teléfono de contacto (opcional)" placeholder="Teléfono" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
          </div>
        )}

        {step === 4 && (
          <div className="rounded-2xl border" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border-2)" }}>
              <span className="text-2xl">{cat?.emoji || "📍"}</span>
              <div>
                <div className="font-extrabold">{cat?.label || "Incidente"}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {showUrgency ? URG[draft.urgency].label : "Informativo"}
                  {showPeople ? ` · ${draft.people} persona(s)` : ""}
                </div>
              </div>
            </div>
            <div className="p-4 text-sm" style={{ color: "var(--fg-2)", borderBottom: "1px solid var(--border-2)" }}>
              {draft.desc || "(Sin descripción)"}
            </div>
            <div className="p-4 text-xs" style={{ color: "var(--muted)" }}>
              📍{" "}
              {draft.loc === "manual" && draft.manual
                ? draft.manual
                : draft.loc === "referencia" && draft.reference
                ? draft.reference
                : `Tu ubicación GPS · ${scenarioCity}`}
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-xs font-bold text-red-500">{error}</p>}
      </div>

      <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button"
          onClick={next}
          disabled={step === 0 && !draft.type}
          className="h-12 flex-1 rounded-2xl font-extrabold text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {step < 4 ? "Continuar" : "Enviar reporte"}
        </button>
      </div>
    </Modal>
  );
}

function LocationStep({ draft, setDraft }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const options: { id: Draft["loc"]; icon: string; title: string; subtitle: string }[] = [
    { id: "gps", icon: "📍", title: "Usar mi ubicación GPS", subtitle: "La Guaira · ±12 m" },
    { id: "manual", icon: "✏️", title: "Ingresar dirección", subtitle: "Sé la calle, barrio o avenida exacta" },
    { id: "referencia", icon: "📌", title: 'No sé la dirección, doy una referencia', subtitle: 'Ej. "cerca de", "al lado de"' },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o) => (
        <div key={o.id}>
          <button type="button"
            onClick={() => setDraft((d) => ({ ...d, loc: o.id }))}
            className="flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left"
            style={{
              background: draft.loc === o.id ? "var(--accent-soft)" : "var(--surface-2)",
              borderColor: draft.loc === o.id ? "var(--accent)" : "var(--border)",
            }}
          >
            <span className="text-lg">{o.icon}</span>
            <span className="flex-1">
              <span className="block text-sm font-bold">{o.title}</span>
              <span className="block text-xs" style={{ color: "var(--muted)" }}>{o.subtitle}</span>
            </span>
          </button>
          {o.id === "manual" && draft.loc === "manual" && (
            <AddressAutocomplete
              value={draft.manual}
              onChange={(v) => setDraft((d) => ({ ...d, manual: v, manualCoords: null }))}
              onPick={(s) => setDraft((d) => ({ ...d, manual: s.label, manualCoords: { lat: s.lat, lng: s.lng } }))}
              placeholder="Ej. Calle Real de Macuto, frente a la plaza"
            />
          )}
          {o.id === "referencia" && draft.loc === "referencia" && (
            <>
              <input
                value={draft.reference}
                onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
                placeholder="Ej. Cerca de la panadería, al lado de la cancha"
                className="mt-2 h-12 w-full rounded-xl border px-3.5 text-sm outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
              />
              <p className="mt-2.5 text-xs font-bold" style={{ color: "var(--fg-2)" }}>
                Marcar zona aproximada en el mapa (opcional)
              </p>
              <RadiusPicker
                value={draft.referenceArea}
                onChange={(v) => setDraft((d) => ({ ...d, referenceArea: v }))}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold" style={{ color: "var(--fg-2)" }}>
        {label}
      </label>
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

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl"
        style={{ background: "var(--surface)", color: "var(--fg)" }}
      >
        {children}
      </div>
    </div>
  );
}
