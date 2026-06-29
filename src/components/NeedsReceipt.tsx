"use client";

import { useState } from "react";
import { NEED_STATUS_LABELS, NeedReport } from "@/lib/needs";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://centrocooperativovenezuela.com";

export function NeedsReceipt({ need, onClose }: { need: NeedReport; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${APP_URL}/necesidad/${need.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;
  const st = NEED_STATUS_LABELS[need.status];
  const date = new Date(need.created_at).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  const waText = encodeURIComponent(
    `Registré una necesidad humanitaria en Centro Cooperativo Venezuela. Caso ${need.case_number}: ${link}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}>
        <div className="text-4xl">✓</div>
        <h2 className="text-lg font-extrabold">Registro enviado</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Gracias por reportar. Tu caso quedó registrado.</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="Código QR del caso" width={180} height={180} className="rounded-xl" style={{ background: "#fff" }} />

        <div className="flex w-full flex-col gap-2 rounded-2xl border p-4 text-left text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div><span className="font-bold">Número de caso:</span> {need.case_number}</div>
          <div><span className="font-bold">Fecha:</span> {date}</div>
          <div className="flex items-center gap-2">
            <span className="font-bold">Estado:</span>
            <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${st.color}1a`, color: st.color }}>{st.label}</span>
          </div>
        </div>

        <div className="flex w-full gap-2">
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-extrabold text-white"
            style={{ background: "#16a34a" }}
          >
            🟢 Compartir por WhatsApp
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold"
            style={{ borderColor: "var(--border)" }}
          >
            {copied ? "✓ Copiado" : "🔗 Copiar enlace"}
          </button>
        </div>

        <button type="button" onClick={onClose} className="h-11 w-full rounded-xl text-sm font-extrabold text-white" style={{ background: "var(--accent)" }}>
          Listo
        </button>
      </div>
    </div>
  );
}
