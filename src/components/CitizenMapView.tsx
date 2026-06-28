"use client";

import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { useExternalPets } from "@/hooks/useExternalPets";
import { useTheme } from "@/lib/theme";
import { HOSPITAL_LIST_DISCLAIMER, MAP_FILTERS, Report, ReportType } from "@/lib/types";
import { ReportForm } from "@/components/ReportForm";
import { ReportDetailPanel } from "@/components/ReportDetailPanel";
import dynamic from "next/dynamic";

const ReportMap = dynamic(() => import("@/components/ReportMap"), { ssr: false });

export function CitizenMapView({ onClose }: { onClose: () => void }) {
  const { reports, loading, error, submit, verify, flushQueue, queueCount } = useReports();
  const externalPets = useExternalPets();
  const { theme, toggleTheme } = useTheme();
  const [filter, setFilter] = useState("todos");
  const [showReport, setShowReport] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState("");

  function toggleOffline() {
    if (offline) flushQueue();
    setOffline((o) => !o);
  }

  const allReports = useMemo(() => [...reports, ...externalPets], [reports, externalPets]);

  const byType = useMemo(() => {
    const def = MAP_FILTERS.find((f) => f.id === filter);
    if (!def || def.types === "todos") return allReports;
    return allReports.filter((r) => (def.types as ReportType[]).includes(r.type));
  }, [allReports, filter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byType;
    return byType.filter((r) => {
      const haystack = [r.place, r.description, ...Object.values(r.details ?? {})]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [byType, search]);

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
              Venezuela · respuesta a emergencias
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

        <div className="absolute left-3 right-3 top-12 z-20">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula o lugar..."
            className="h-9 w-full rounded-lg border px-3 text-xs font-semibold outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
          />
        </div>

        <div className="absolute left-0 right-0 top-24 z-20 flex gap-2 overflow-x-auto px-3 pb-1">
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
        {!loading && !error && filter === "lista_hospitales" && (
          <StatusBanner text={HOSPITAL_LIST_DISCLAIMER} tone="warning" />
        )}
        {!loading && !error && filter !== "lista_hospitales" && filtered.length === 0 && (
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
          onVerify={selected.external ? undefined : () => verify(selected, "confirm")}
          onFalse={selected.external ? undefined : () => verify(selected, "incorrect")}
          onAttended={selected.external ? undefined : () => verify(selected, "attended")}
          onResolved={selected.external ? undefined : () => verify(selected, "resolved")}
          onViewMap={() => {
            setFlyTarget([selected.lat, selected.lng]);
            setSelected(null);
          }}
        />
      )}

      {showReport && (
        <ReportForm
          onClose={() => setShowReport(false)}
          onSubmit={(draft) => submit(draft, offline)}
        />
      )}
    </div>
  );
}

function StatusBanner({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" | "warning" }) {
  return (
    <div
      className="absolute left-3 right-3 top-36 z-20 rounded-xl px-3.5 py-2.5 text-center text-xs font-bold"
      style={
        tone === "error"
          ? { background: "rgba(220,38,38,.12)", border: "1px solid rgba(220,38,38,.3)", color: "#dc2626" }
          : tone === "warning"
          ? { background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", color: "#7c3aed", lineHeight: 1.4 }
          : { background: "var(--surface)", color: "var(--muted)" }
      }
    >
      {text}
    </div>
  );
}
