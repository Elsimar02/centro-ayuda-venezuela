"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NEED_STATUS_LABELS, NeedReport } from "@/lib/needs";
import { fetchNeedById } from "@/lib/needsApi";
import { URG } from "@/lib/types";

export default function NeedPublicPage() {
  const { id } = useParams<{ id: string }>();
  const [need, setNeed] = useState<NeedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNeedById(id)
      .then((n) => setNeed(n))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-5" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <div className="text-sm font-extrabold">Centro de Coordinación · Necesidades Humanitarias</div>

      {loading && <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando…</p>}
      {!loading && error && <p className="text-sm font-bold text-red-500">{error}</p>}
      {!loading && !error && !need && <p className="text-sm" style={{ color: "var(--muted)" }}>No encontramos este caso.</p>}

      {need && (
        <div className="flex flex-col gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="text-lg font-extrabold">{need.case_number}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${NEED_STATUS_LABELS[need.status].color}1a`, color: NEED_STATUS_LABELS[need.status].color }}>
              {NEED_STATUS_LABELS[need.status].label}
            </span>
            <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${URG[need.urgency].color}1a`, color: URG[need.urgency].color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: URG[need.urgency].color }} />
              {URG[need.urgency].label}
            </span>
          </div>
          <div className="text-sm"><span className="font-bold">Ubicación:</span> {[need.direccion, need.parroquia, need.municipio, need.estado].filter(Boolean).join(", ")}</div>
          <div className="text-sm"><span className="font-bold">Personas afectadas:</span> {need.people_total}</div>
          <div className="text-sm"><span className="font-bold">Descripción:</span> {need.description || "—"}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Registrado el {new Date(need.created_at).toLocaleString("es-VE")}</div>
        </div>
      )}
    </div>
  );
}
