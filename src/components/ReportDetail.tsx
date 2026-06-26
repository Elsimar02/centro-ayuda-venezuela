"use client";

import { useState } from "react";
import { CATS, Report, STATUS, TYPE_FIELDS, URG } from "@/lib/types";
import { telLink, waLink } from "@/lib/contact";
import { ReportUpdates } from "@/components/ReportUpdates";

function timeAgo(createdAt: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (m <= 0) return "ahora";
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

export function ReportDetail({ report }: { report: Report }) {
  const c = CATS[report.type];
  const st = STATUS[report.status];
  const ur = URG[report.urgency];
  const fields = TYPE_FIELDS[report.type] || [];
  const photos = report.media.filter((m) => m.kind === "foto" && m.url);
  const radius = Number(report.details?._approx_radius_m);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const reporterWa = report.contact_phone ? waLink(report.contact_phone) : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-xl"
          style={{ background: `${c.color}24` }}
        >
          {c.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold leading-tight">{c.label}</div>
          <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{timeAgo(report.created_at)}</div>
        </div>
        <span className="flex-shrink-0 rounded-md px-2 py-1 text-[10px] font-bold" style={{ background: `${st.color}24`, color: st.color }}>
          {st.label}
        </span>
      </div>

      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((m, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={m.url}
              alt={`Foto del reporte ${i + 1}`}
              onClick={() => m.url && setLightbox(m.url)}
              className="h-32 w-32 flex-shrink-0 cursor-pointer rounded-xl object-cover"
              style={{ background: "var(--surface-2)" }}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <InfoItem label="Urgencia">
          <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: ur.color }}>
            <span className="h-2 w-2 rounded-full" style={{ background: ur.color }} />
            {ur.label}
          </span>
        </InfoItem>
        <InfoItem label="Publicado por">{report.reporter_name || "Anónimo"}</InfoItem>
        {report.people > 0 && <InfoItem label="Personas afectadas">{report.people}</InfoItem>}
        <InfoItem label="Confirmaciones">
          ✓ {report.vc_confirm} · atendido {report.vc_attended} · incorrecto {report.vc_incorrect}
        </InfoItem>
      </div>

      <InfoItem label="Dirección / ubicación">
        📍 {report.place}
        {radius > 0 ? ` · zona aprox. ${radius} m` : ""}
      </InfoItem>

      <InfoItem label="Descripción">{report.description || "(Sin descripción)"}</InfoItem>

      {report.contact_phone && (
        <div className="flex flex-col gap-2 rounded-2xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div className="text-xs font-bold" style={{ color: "var(--fg-2)" }}>
            Contacto de quien reportó · {report.reporter_name || "Anónimo"}
          </div>
          <div className="flex flex-wrap gap-2">
            {reporterWa && (
              <a
                href={reporterWa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white"
                style={{ background: "#16a34a" }}
              >
                🟢 WhatsApp
              </a>
            )}
            <a
              href={telLink(report.contact_phone)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}
            >
              📞 Llamar
            </a>
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border p-3.5" style={{ borderColor: "var(--border)" }}>
          {fields.map((f) =>
            report.details[f.key] ? (
              <InfoItem key={f.key} label={f.label}>
                {report.details[f.key]}
              </InfoItem>
            ) : null
          )}
        </div>
      )}

      <ReportUpdates reportId={report.id} />

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Foto del reporte ampliada"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="text-sm" style={{ color: "var(--fg-2)" }}>{children}</div>
    </div>
  );
}
