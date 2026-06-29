"use client";

import { useState } from "react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  Availability,
  NewProvider,
  PROVIDER_KINDS,
  ProviderKind,
  RESOURCES,
  RESOURCE_GROUPS,
  submitProvider,
} from "@/lib/marketplace";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function QuieroAyudarForm({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const [kind, setKind] = useState<ProviderKind>("persona");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [placeText, setPlaceText] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [offers, setOffers] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("");
  const [availability, setAvailability] = useState<Availability>("inmediata");
  const [availableFrom, setAvailableFrom] = useState(todayISO());
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggle(list: string[], set: (v: string[]) => void, key: string) {
    set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  }

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("Pon un nombre para que la gente sepa quién ofrece la ayuda.");
    if (!coords) return setError("Selecciona tu ubicación en la lista de sugerencias.");
    if (!phone.trim() && !whatsapp.trim() && !email.trim())
      return setError("Deja al menos un contacto (teléfono, WhatsApp o correo).");
    if (offers.length === 0 && needs.length === 0)
      return setError("Marca al menos algo que ofreces o que necesitas.");

    const payload: NewProvider = {
      kind, name, phone, whatsapp, email,
      lat: coords.lat, lng: coords.lng, place: placeText,
      radius_km: radius, offers, needs, quantity, availability,
      available_from: availability === "programada" ? availableFrom : null,
      schedule, notes,
    };
    setSaving(true);
    try {
      await submitProvider(payload);
      setDone(true);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <Shell onClose={onClose} title="🤝 Quiero ayudar">
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-5xl">🎉</span>
          <h3 className="text-xl font-extrabold">¡Gracias! Ya estás en el directorio</h3>
          <p className="max-w-sm text-sm" style={{ color: "var(--muted)" }}>
            Las personas y organizaciones que necesitan lo que ofreces ya pueden verte y contactarte.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 h-11 rounded-xl px-6 text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            Ver el directorio
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onClose={onClose} title="🤝 Quiero ayudar">
      <div className="flex flex-col gap-5">
        {/* Tipo */}
        <Field label="¿Quién eres?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROVIDER_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className="flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold"
                style={
                  kind === k.id
                    ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
                    : { borderColor: "var(--border)", color: "var(--fg-2)" }
                }
              >
                <span className="text-xl">{k.emoji}</span>
                {k.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Contacto */}
        <Field label="Nombre">
          <Input value={name} onChange={setName} placeholder="Tu nombre o el de la organización" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Teléfono">
            <Input value={phone} onChange={setPhone} placeholder="0414..." type="tel" />
          </Field>
          <Field label="WhatsApp">
            <Input value={whatsapp} onChange={setWhatsapp} placeholder="0414..." type="tel" />
          </Field>
          <Field label="Correo">
            <Input value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
          </Field>
        </div>

        {/* Ubicación */}
        <Field label="Ubicación">
          <AddressAutocomplete
            value={placeText}
            onChange={setPlaceText}
            onPick={(s) => {
              setPlaceText(s.label);
              setCoords({ lat: s.lat, lng: s.lng });
            }}
            placeholder="Ciudad, sector o dirección"
          />
          {coords && (
            <p className="mt-1 text-xs font-semibold" style={{ color: "#16a34a" }}>
              ✓ Ubicación fijada
            </p>
          )}
        </Field>

        <Field label={`Radio máximo para entregar ayuda: ${radius} km`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full"
            aria-label="Radio máximo de entrega en kilómetros"
          />
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            0 = sin límite definido. Solo aparecerás para necesidades dentro de tu radio.
          </p>
        </Field>

        {/* Recursos que ofrece */}
        <Field label="¿Qué puedes ofrecer?">
          <ResourcePicker selected={offers} onToggle={(k) => toggle(offers, setOffers, k)} accent="#16a34a" />
        </Field>

        {/* Recursos que necesita */}
        <Field label="¿Qué necesitas? (opcional)">
          <ResourcePicker selected={needs} onToggle={(k) => toggle(needs, setNeeds, k)} accent="#dc2626" />
        </Field>

        {/* Disponibilidad */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cantidad disponible">
            <Input value={quantity} onChange={setQuantity} placeholder="Ej. 10 colchones, 1 camión" />
          </Field>
          <Field label="Disponibilidad">
            <div className="flex gap-2">
              {(["inmediata", "programada"] as Availability[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvailability(a)}
                  className="h-10 flex-1 rounded-xl border text-sm font-bold capitalize"
                  style={
                    availability === a
                      ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
                      : { borderColor: "var(--border)", color: "var(--fg-2)" }
                  }
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
        </div>
        {availability === "programada" && (
          <Field label="Disponible a partir de">
            <input
              type="date"
              value={availableFrom}
              min={todayISO()}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
            />
          </Field>
        )}
        <Field label="Horario / notas">
          <Input value={schedule} onChange={setSchedule} placeholder="Ej. Lun a Vie 8am-5pm" />
        </Field>
        <Field label="Algo más que quieras aclarar (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Condiciones, instrucciones de contacto, etc."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
          />
        </Field>

        {error && (
          <p className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "rgba(220,38,38,.1)", color: "#dc2626" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-12 rounded-xl text-base font-extrabold text-white disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {saving ? "Registrando..." : "Publicar en el directorio"}
        </button>
      </div>
    </Shell>
  );
}

function ResourcePicker({
  selected,
  onToggle,
  accent,
}: {
  selected: string[];
  onToggle: (key: string) => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {RESOURCE_GROUPS.map((g) => {
        const items = RESOURCES.filter((r) => r.group === g.id);
        return (
          <div key={g.id}>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              {g.emoji} {g.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((r) => {
                const on = selected.includes(r.key);
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onToggle(r.key)}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                    style={
                      on
                        ? { borderColor: accent, background: `${accent}1f`, color: accent }
                        : { borderColor: "var(--border)", color: "var(--fg-2)" }
                    }
                  >
                    {r.emoji} {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto" style={{ background: "rgba(0,0,0,.45)" }}>
      <div
        className="relative my-6 h-fit w-full max-w-2xl rounded-2xl p-5 sm:p-6"
        style={{ background: "var(--surface)", color: "var(--fg)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
    />
  );
}
