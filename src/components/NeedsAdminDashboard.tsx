"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { NEED_STATUS_LABELS, NEEDS_LIST, NeedReport, NeedStatus } from "@/lib/needs";
import { queryNeeds, supabaseNeedsAll, updateNeedStatus } from "@/lib/needsApi";
import { URG, Urgency } from "@/lib/types";

const NeedsMap = dynamic(() => import("@/components/NeedsMap"), { ssr: false });

const PAGE_SIZE = 50;

export function NeedsAdminDashboard({ theme }: { theme: "light" | "dark" }) {
  const [view, setView] = useState<"tabla" | "mapa">("tabla");
  const [rows, setRows] = useState<NeedReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [urgency, setUrgency] = useState("");
  const [need, setNeed] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NeedReport | null>(null);
  const [mapNeeds, setMapNeeds] = useState<NeedReport[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    queryNeeds({
      status: (status as NeedStatus) || undefined,
      urgency: urgency || undefined,
      need: need || undefined,
      search,
      page,
      pageSize: PAGE_SIZE,
    })
      .then(({ rows, total }) => {
        setRows(rows);
        setTotal(total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [status, urgency, need, search, page]);

  useEffect(() => {
    if (view === "mapa") {
      supabaseNeedsAll().then(setMapNeeds).catch(() => {});
    }
  }, [view]);

  async function handleStatusChange(n: NeedReport, s: NeedStatus) {
    await updateNeedStatus(n.id, s);
    setRows((rs) => rs.map((r) => (r.id === n.id ? { ...r, status: s } : r)));
    setSelected((sel) => (sel?.id === n.id ? { ...sel, status: s } : sel));
  }

  async function handleExport(format: "csv" | "excel" | "pdf") {
    setExporting(format);
    try {
      const all = await supabaseNeedsAll({ status: (status as NeedStatus) || undefined, urgency: urgency || undefined, need: need || undefined, search });
      if (format === "csv") exportCsv(all);
      if (format === "excel") await exportExcel(all);
      if (format === "pdf") await exportPdf(all);
    } finally {
      setExporting(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setView("tabla")} className="h-9 rounded-lg px-3.5 text-xs font-bold" style={{ background: view === "tabla" ? "var(--accent)" : "var(--surface)", color: view === "tabla" ? "#fff" : "var(--fg)", border: "1px solid var(--border)" }}>📋 Tabla</button>
          <button type="button" onClick={() => setView("mapa")} className="h-9 rounded-lg px-3.5 text-xs font-bold" style={{ background: view === "mapa" ? "var(--accent)" : "var(--surface)", color: view === "mapa" ? "#fff" : "var(--fg)", border: "1px solid var(--border)" }}>🗺️ Mapa</button>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={!!exporting} onClick={() => handleExport("excel")} className="h-9 rounded-lg border px-3 text-xs font-bold" style={{ borderColor: "var(--border)" }}>{exporting === "excel" ? "…" : "📊 Excel"}</button>
          <button type="button" disabled={!!exporting} onClick={() => handleExport("csv")} className="h-9 rounded-lg border px-3 text-xs font-bold" style={{ borderColor: "var(--border)" }}>{exporting === "csv" ? "…" : "📄 CSV"}</button>
          <button type="button" disabled={!!exporting} onClick={() => handleExport("pdf")} className="h-9 rounded-lg border px-3 text-xs font-bold" style={{ borderColor: "var(--border)" }}>{exporting === "pdf" ? "…" : "🧾 PDF"}</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre, caso, dirección…"
          className="h-9 flex-1 min-w-[200px] rounded-lg border px-3 text-xs outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-9 rounded-lg border px-2 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <option value="">Todos los estados</option>
          {Object.entries(NEED_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={urgency} onChange={(e) => { setUrgency(e.target.value); setPage(1); }} className="h-9 rounded-lg border px-2 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <option value="">Toda urgencia</option>
          {(Object.entries(URG) as [Urgency, typeof URG[Urgency]][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={need} onChange={(e) => { setNeed(e.target.value); setPage(1); }} className="h-9 rounded-lg border px-2 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <option value="">Toda necesidad</option>
          {NEEDS_LIST.map((n) => <option key={n.key} value={n.key}>{n.emoji} {n.label}</option>)}
        </select>
      </div>

      {error && <p className="text-xs font-bold text-red-500">{error}</p>}

      {view === "tabla" ? (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ background: "var(--surface-2)" }}>
                <tr>
                  {["Caso", "Contacto", "Ubicación", "Personas", "Urgencia", "Estado", "Fecha"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-bold" style={{ color: "var(--fg-2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center" style={{ color: "var(--muted)" }}>Cargando…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center" style={{ color: "var(--muted)" }}>Sin resultados.</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2.5 font-bold">{r.case_number}</td>
                    <td className="px-3 py-2.5">{r.contact_name}</td>
                    <td className="max-w-[180px] truncate px-3 py-2.5">{[r.direccion, r.estado].filter(Boolean).join(", ")}</td>
                    <td className="px-3 py-2.5">{r.people_total}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bold" style={{ background: `${URG[r.urgency].color}1a`, color: URG[r.urgency].color }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: URG[r.urgency].color }} />
                        {URG[r.urgency].label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: `${NEED_STATUS_LABELS[r.status].color}1a`, color: NEED_STATUS_LABELS[r.status].color }}>
                        {NEED_STATUS_LABELS[r.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: "var(--muted)" }}>{new Date(r.created_at).toLocaleDateString("es-VE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 text-xs font-bold" style={{ borderTop: "1px solid var(--border)", color: "var(--fg-2)" }}>
            <span>{total} caso(s) · página {page} de {pageCount}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-2.5 py-1 disabled:opacity-40" style={{ borderColor: "var(--border)" }}>‹</button>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-2.5 py-1 disabled:opacity-40" style={{ borderColor: "var(--border)" }}>›</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", height: "calc(100vh - 320px)" }}>
          <NeedsMap needs={mapNeeds} theme={theme} onSelect={setSelected} />
        </div>
      )}

      {selected && (
        <NeedDetailCard need={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}

function NeedDetailCard({
  need,
  onClose,
  onStatusChange,
}: {
  need: NeedReport;
  onClose: () => void;
  onStatusChange: (n: NeedReport, s: NeedStatus) => void;
}) {
  const needLabels = need.needs.map((k) => NEEDS_LIST.find((n) => n.key === k)?.label || k);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl" style={{ background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-extrabold">{need.case_number}</h2>
          <button type="button" onClick={onClose} className="text-xl" style={{ color: "var(--muted)" }}>×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-2.5 text-sm">
            <div><span className="font-bold">Contacto:</span> {need.contact_name} · {need.contact_phone}</div>
            <div><span className="font-bold">Ubicación:</span> {[need.direccion, need.parroquia, need.municipio, need.estado].filter(Boolean).join(", ")}</div>
            <div><span className="font-bold">Personas:</span> {need.people_total} (niños: {need.people_children}, adultos mayores: {need.people_elderly}, embarazadas: {need.people_pregnant}, discapacidad: {need.people_disabled}, mascotas: {need.people_pets})</div>
            <div><span className="font-bold">Necesidades:</span> {needLabels.join(", ") || "—"}</div>
            <div><span className="font-bold">Descripción:</span> {need.description || "—"}</div>
            {need.media.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {need.media.filter((m) => m.kind === "foto").map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={m.url} src={m.url} alt="" className="aspect-square rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          {(Object.keys(NEED_STATUS_LABELS) as NeedStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(need, s)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{
                background: need.status === s ? NEED_STATUS_LABELS[s].color : "var(--surface-2)",
                color: need.status === s ? "#fff" : "var(--fg)",
              }}
            >
              {NEED_STATUS_LABELS[s].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function toExportRows(needs: NeedReport[]) {
  return needs.map((n) => ({
    Caso: n.case_number,
    Contacto: n.contact_name,
    Teléfono: n.contact_phone,
    Estado: n.estado,
    Municipio: n.municipio || "",
    Parroquia: n.parroquia || "",
    Dirección: n.direccion || "",
    Personas: n.people_total,
    Niños: n.people_children,
    "Adultos mayores": n.people_elderly,
    Necesidades: n.needs.map((k) => NEEDS_LIST.find((x) => x.key === k)?.label || k).join("; "),
    Urgencia: URG[n.urgency].label,
    "Estado del caso": NEED_STATUS_LABELS[n.status].label,
    Descripción: n.description,
    Fecha: new Date(n.created_at).toLocaleString("es-VE"),
  }));
}

function exportCsv(needs: NeedReport[]) {
  const rows = toExportRows(needs);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(","))].join("\n");
  downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "necesidades.csv");
}

async function exportExcel(needs: NeedReport[]) {
  const XLSX = await import("xlsx");
  const rows = toExportRows(needs);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Necesidades");
  XLSX.writeFile(wb, "necesidades.xlsx");
}

async function exportPdf(needs: NeedReport[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const rows = toExportRows(needs);
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Necesidades Humanitarias", 14, 14);
  autoTable(doc, {
    startY: 20,
    head: [Object.keys(rows[0] || {})],
    body: rows.map((r) => Object.values(r)),
    styles: { fontSize: 7 },
  });
  doc.save("necesidades.pdf");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
