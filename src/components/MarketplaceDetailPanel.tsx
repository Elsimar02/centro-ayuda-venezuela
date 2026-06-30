"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { telLink, waLink } from "@/lib/contact";
import {
  AidProvider,
  KIND_CONFIG,
  NeedEntry,
  needResourceEmoji,
  needResourceLabel,
  resourceEmoji,
  resourceLabel,
} from "@/lib/marketplace";

export type MarketplaceItem = { kind: "provider"; data: AidProvider } | { kind: "need"; data: NeedEntry };

const KIND_GRADIENTS: Record<string, string> = {
  persona: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  empresa: "linear-gradient(135deg,#0ea5e9,#2563eb)",
  ong: "linear-gradient(135deg,#16a34a,#0d9488)",
  iglesia: "linear-gradient(135deg,#d97706,#b45309)",
  voluntario: "linear-gradient(135deg,#16a34a,#65a30d)",
  refugio: "linear-gradient(135deg,#0d9488,#0891b2)",
  centro_acopio: "linear-gradient(135deg,#d97706,#dc2626)",
  institucion: "linear-gradient(135deg,#475569,#1e293b)",
  necesidad: "linear-gradient(135deg,#dc2626,#b91c1c)",
};

export function MarketplaceDetailPanel({ item, onClose }: { item: MarketplaceItem; onClose: () => void }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox, onClose]);

  const isProvider = item.kind === "provider";
  const p = isProvider ? item.data : null;
  const n = !isProvider ? item.data : null;

  const name = p?.name ?? n!.name;
  const place = p?.place ?? n!.place ?? "";
  const phone = p?.phone ?? n!.phone;
  const whatsapp = p?.whatsapp ?? n!.whatsapp;
  const email = p?.email ?? n!.email;
  const media = p?.media ?? n!.media;
  const offers = p?.offers ?? [];
  const needs = p ? p.needs : n!.needs;
  const notes = p?.notes ?? n!.notes;
  const wa = whatsapp ? waLink(whatsapp) : null;
  const heroPhoto = media.find((m) => m.url)?.url;
  const gradient = isProvider ? KIND_GRADIENTS[p!.kind] ?? KIND_GRADIENTS.institucion : KIND_GRADIENTS.necesidad;
  const kindLabel = isProvider
    ? KIND_CONFIG[p!.kind].label
    : n!.source === "reporte"
      ? "Reportado en el mapa"
      : "Necesidad humanitaria";
  const heroEmoji = isProvider ? KIND_CONFIG[p!.kind].emoji : "🆘";

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal>
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: "rgba(0,0,0,.5)", animation: "ccfadein .2s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto"
        style={{ background: "var(--surface)", color: "var(--fg)", animation: "ccslidein .28s cubic-bezier(.16,1,.3,1)" }}
      >
        {/* Hero */}
        <div className="relative h-56 w-full flex-shrink-0 overflow-hidden">
          {heroPhoto ? (
            <Image src={heroPhoto} alt="" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: gradient }} />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg,rgba(0,0,0,.05) 0%,rgba(0,0,0,.65) 100%)" }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-lg text-white"
            style={{ background: "rgba(0,0,0,.35)" }}
          >
            ×
          </button>
          {!heroPhoto && (
            <span className="absolute left-5 top-5 text-5xl drop-shadow-lg">{heroEmoji}</span>
          )}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <span
              className="mb-2 inline-block rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white"
              style={{ background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)" }}
            >
              {kindLabel}
            </span>
            <h2 className="text-2xl font-extrabold leading-tight text-white drop-shadow-sm">{name}</h2>
            {place && (
              <p className="mt-1 text-sm font-semibold text-white/90">📍 {place}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {isProvider && (
            <div className="flex gap-2">
              <Pill
                color={p!.availability === "inmediata" ? "#16a34a" : "#d97706"}
                label={p!.availability === "inmediata" ? "Disponible ya" : "Programado"}
              />
              {p!.radius_km > 0 && <Pill color="#2563eb" label={`Entrega hasta ${p!.radius_km} km`} />}
            </div>
          )}

          {offers.length > 0 && (
            <Section icon="🟢" title="Ofrece">
              <ChipRow color="#16a34a" keys={offers} labelFn={resourceLabel} emojiFn={resourceEmoji} />
            </Section>
          )}

          {needs.length > 0 && (
            <Section icon="🔴" title="Necesita">
              <ChipRow
                color="#dc2626"
                keys={needs}
                labelFn={isProvider ? resourceLabel : needResourceLabel}
                emojiFn={isProvider ? resourceEmoji : needResourceEmoji}
              />
            </Section>
          )}

          {isProvider && (p!.quantity || p!.schedule) && (
            <Section icon="🗓️" title="Disponibilidad">
              <div
                className="flex flex-col gap-1.5 rounded-xl border p-3 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--fg-2)" }}
              >
                {p!.quantity && <p><span className="font-bold">Cantidad:</span> {p!.quantity}</p>}
                {p!.available_from && (
                  <p><span className="font-bold">Desde:</span> {p!.available_from}</p>
                )}
                {p!.schedule && <p><span className="font-bold">Horario:</span> {p!.schedule}</p>}
              </div>
            </Section>
          )}

          {notes && (
            <Section icon="📝" title="Detalles">
              <p
                className="rounded-xl border p-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--fg-2)" }}
              >
                {notes}
              </p>
            </Section>
          )}

          {media.length > 0 && (
            <Section icon="📷" title="Fotos">
              <div className="grid grid-cols-3 gap-2">
                {media.map((m, i) =>
                  m.url ? (
                    <button
                      type="button"
                      key={m.url ?? i}
                      onClick={() => m.url && setLightbox(m.url)}
                      aria-label="Ampliar foto"
                      className="aspect-square overflow-hidden rounded-xl"
                    >
                      <Image src={m.url} alt="Foto" width={150} height={150} className="h-full w-full object-cover" />
                    </button>
                  ) : null
                )}
              </div>
            </Section>
          )}

          <Section icon="📞" title="Contacto">
            <div className="flex flex-wrap gap-2">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-extrabold text-white shadow-sm"
                  style={{ background: "#16a34a" }}
                >
                  💬 WhatsApp
                </a>
              )}
              {phone && (
                <a
                  href={telLink(phone)}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-extrabold"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                >
                  ☎️ Llamar
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-extrabold"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                >
                  ✉️ Correo
                </a>
              )}
              {!wa && !phone && !email && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>Sin datos de contacto.</p>
              )}
            </div>
          </Section>

          {/* Marca de agua, queda bien al tomar captura para compartir */}
          <div className="mt-2 flex items-center justify-center gap-1.5 border-t pt-4 text-[11px] font-bold" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            🇻🇪 Quiero Ayudar · centrocooperativovenezuela.com
          </div>
        </div>

        {lightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
            >
              ×
            </button>
            <div onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        <span>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="rounded-full px-3 py-1.5 text-xs font-extrabold"
      style={{ background: `${color}1f`, color }}
    >
      {label}
    </span>
  );
}

function ChipRow({
  color,
  keys,
  labelFn,
  emojiFn,
}: {
  color: string;
  keys: string[];
  labelFn: (k: string) => string;
  emojiFn: (k: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((key) => (
        <span
          key={key}
          className="rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
          style={{ background: `${color}14`, color }}
        >
          {emojiFn(key)} {labelFn(key)}
        </span>
      ))}
    </div>
  );
}
