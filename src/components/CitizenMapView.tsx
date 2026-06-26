"use client";

import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { useTheme } from "@/lib/theme";
import { MAP_FILTERS, Report, ReportType } from "@/lib/types";
import { ReportForm } from "@/components/ReportForm";
import { ReportDetailPanel } from "@/components/ReportDetailPanel";
import dynamic from "next/dynamic";

const ReportMap = dynamic(() => import("@/components/ReportMap"), { ssr: false });

const SCENARIO_CITY = "La Guaira";

export function CitizenMapView({ onClose }: { onClose: () => void }) {
  const { reports, loading, error, submit, verify, flushQueue, queueCount } = useReports();
  const { theme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState("todos");
  const [showReport, setShowReport] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [offline, setOffline] = useState(false);

  function toggleOffline() {
    if (offline) flushQueue();
    setOffline((o) => !o);
  }

  const filtered = useMemo(() => {
    const def = MAP_FILTERS.find((f) => f.id === filter);
    if (!def || def.types === "todos") return reports;
    return reports.filter((r) => (def.types as ReportType[]).includes(r.type));
  }, [reports, filter]);

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
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
          <button type="button"
            onClick={onClose}
            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)" }}
          >
            ✕ <span className="hidden sm:inline">Cerrar</span>
          </button>
          <button type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="relative flex-1">
        <div className="absolute inset-0">
          <ReportMap
            reports={filtered}
            theme={theme}
            base="streets"
            center={[8, -66]}
            zoom={6}
            flyTarget={flyTarget}
            onSelect={setSelected}
          />
        </div>

        <div className="absolute left-3 right-3 top-3 z-20 flex gap-2">
          <button type="button"
            onClick={toggleOffline}
            className="flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: offline ? "#d97706" : "#16a34a",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: offline ? "#d97706" : "#16a34a" }} />
            {offline ? `OFFLINE · ${queueCount} en cola` : "EN LÍNEA"}
          </button>
        </div>

        <div className="absolute left-0 right-0 top-14 z-20 flex gap-2 overflow-x-auto px-3 pb-1">
          {MAP_FILTERS.map((f) => (
            <button type="button"
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex h-8.5 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold"
              style={{
                background: filter === f.id ? "var(--accent)" : "var(--surface)",
                color: filter === f.id ? "#fff" : "var(--fg)",
                borderColor: filter === f.id ? "var(--accent)" : "var(--border)",
              }}
            >
              <span>{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <StatusBanner text="Cargando reportes…" />}
        {!loading && error && <StatusBanner text={error} tone="error" />}
        {!loading && !error && filtered.length === 0 && (
          <StatusBanner text="Sin reportes todavía · sé el primero en reportar" />
        )}

        <button type="button"
          onClick={() => setShowReport(true)}
          className="absolute bottom-6 right-5 z-20 flex h-14 items-center gap-2 rounded-full px-5 font-extrabold text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          + Reportar
        </button>
      </div>

      {selected && (
        <ReportDetailPanel
          report={selected}
          onClose={() => setSelected(null)}
          onVerify={() => verify(selected, "confirm")}
          onFalse={() => verify(selected, "incorrect")}
          onAttended={() => verify(selected, "attended")}
          onResolved={() => verify(selected, "resolved")}
          onViewMap={() => {
            setFlyTarget([selected.lat, selected.lng]);
            setSelected(null);
          }}
        />
      )}

      {showReport && (
        <ReportForm
          scenarioCity={SCENARIO_CITY}
          onClose={() => setShowReport(false)}
          onSubmit={(draft) => submit(draft, SCENARIO_CITY, offline)}
        />
      )}
    </div>
  );
}

function StatusBanner({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" }) {
  return (
    <div
      className="absolute left-3 right-3 top-28 z-20 rounded-xl px-3.5 py-2.5 text-center text-xs font-bold"
      style={
        tone === "error"
          ? { background: "rgba(220,38,38,.12)", border: "1px solid rgba(220,38,38,.3)", color: "#dc2626" }
          : { background: "var(--surface)", color: "var(--muted)" }
      }
    >
      {text}
    </div>
  );
}
