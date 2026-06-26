"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { useTheme } from "@/lib/theme";
import { ReportForm } from "@/components/ReportForm";
import { ReportDetailPanel } from "@/components/ReportDetailPanel";
import { ReportRow } from "@/components/ReportRow";
import { CitizenMapView } from "@/components/CitizenMapView";
import { Report } from "@/lib/types";

const SCENARIO_CITY = "La Guaira";

export default function Home() {
  const { reports, loading, verify, submit } = useReports();
  const { theme, toggleTheme } = useTheme();
  const [showMap, setShowMap] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);

  const statCards = useMemo(() => {
    const byStatus = (s: string) => reports.filter((r) => r.status === s).length;
    return [
      { icon: "📋", label: "Total reportes", value: reports.length },
      { icon: "🆘", label: "Sin verificar", value: byStatus("sin_verificar") },
      { icon: "🔄", label: "En proceso", value: byStatus("en_proceso") },
      { icon: "✓", label: "Verificados", value: byStatus("verificado") },
    ];
  }, [reports]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--accent)" }}>
            <span className="text-white">📍</span>
          </div>
          <div>
            <div className="text-sm font-extrabold leading-tight">Centro de Coordinación</div>
            <div className="hidden text-xs sm:block" style={{ color: "var(--muted)" }}>
              {SCENARIO_CITY} · respuesta a emergencias
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)" }}
          >
            🗺️ <span className="hidden sm:inline">Mapa</span>
          </button>
          <Link
            href="/admin"
            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)" }}
          >
            🖥 <span className="hidden sm:inline">Panel</span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="mb-2 text-lg">{s.icon}</div>
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="px-4 py-3 text-sm font-extrabold" style={{ borderBottom: "1px solid var(--border)" }}>
            Reportes recientes
          </div>
          {reports.slice(0, 10).map((r) => (
            <ReportRow key={r.id} report={r} onClick={() => setSelected(r)} />
          ))}
          {!loading && reports.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
              Sin reportes todavía · sé el primero en reportar
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowReport(true)}
          className="fixed bottom-6 right-5 z-20 flex h-14 items-center gap-2 rounded-full px-5 font-extrabold text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          + Reportar
        </button>
      </main>

      {selected && (
        <ReportDetailPanel
          report={selected}
          onClose={() => setSelected(null)}
          onVerify={() => verify(selected, "confirm")}
          onFalse={() => verify(selected, "incorrect")}
          onAttended={() => verify(selected, "attended")}
          onResolved={() => verify(selected, "resolved")}
        />
      )}

      {showReport && (
        <ReportForm
          scenarioCity={SCENARIO_CITY}
          onClose={() => setShowReport(false)}
          onSubmit={(draft) => submit(draft, SCENARIO_CITY, false)}
        />
      )}

      {showMap && <CitizenMapView onClose={() => setShowMap(false)} />}
    </div>
  );
}
