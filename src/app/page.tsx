"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { useTheme } from "@/lib/theme";
import { Report, ReportType } from "@/lib/types";
import { ReportForm } from "@/components/ReportForm";
import { ReportRow } from "@/components/ReportRow";

const ReportMap = dynamic(() => import("@/components/ReportMap"), { ssr: false });

const SCENARIO_CITY = "La Guaira";

const FILTERS: { id: string; label: string; emoji: string; types: ReportType[] | "todos" }[] = [
  { id: "todos", label: "Todos", emoji: "◎", types: "todos" },
  { id: "personas", label: "Personas", emoji: "🔴", types: ["persona_desaparecida", "persona_encontrada_viva", "persona_fallecida"] },
  { id: "atrapada", label: "Atrapados", emoji: "🆘", types: ["atrapada", "colapso"] },
  { id: "calles", label: "Vías", emoji: "🚧", types: ["bloqueo", "peligro"] },
  { id: "hospital", label: "Hospitales", emoji: "🏥", types: ["hospital", "hospital_insumos"] },
  { id: "refugio", label: "Refugios", emoji: "⛺", types: ["refugio", "ayuda"] },
  { id: "agua", label: "Agua", emoji: "💧", types: ["agua"] },
  { id: "comida", label: "Comida", emoji: "🍞", types: ["alimentos"] },
  { id: "medicinas", label: "Medicinas", emoji: "💊", types: ["insumos_disponibles"] },
  { id: "mascotas", label: "Mascotas", emoji: "🐾", types: ["mascota_perdida", "mascota_encontrada"] },
];

export default function Home() {
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
    const def = FILTERS.find((f) => f.id === filter);
    if (!def || def.types === "todos") return reports;
    return reports.filter((r) => (def.types as ReportType[]).includes(r.type));
  }, [reports, filter]);

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
          <Link
            href="/admin"
            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)" }}
          >
            🖥 <span className="hidden sm:inline">Panel</span>
          </Link>
          <button
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
            center={[10.606, -66.915]}
            flyTarget={flyTarget}
            onSelect={setSelected}
          />
        </div>

        <div className="absolute left-3 right-3 top-3 z-20 flex gap-2">
          <button
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
          {FILTERS.map((f) => (
            <button
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

        <button
          onClick={() => setShowReport(true)}
          className="absolute bottom-6 right-5 z-20 flex h-14 items-center gap-2 rounded-full px-5 font-extrabold text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          + Reportar
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center" onClick={() => setSelected(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl"
            style={{ background: "var(--surface)" }}
          >
            <ReportRow
              report={selected}
              onVerify={() => verify(selected, "confirm")}
              onFalse={() => verify(selected, "incorrect")}
            />
            <div className="p-4 text-sm" style={{ color: "var(--fg-2)" }}>{selected.description}</div>
            <div className="flex gap-2 p-4">
              <button
                onClick={() => verify(selected, "attended")}
                className="h-11 flex-1 rounded-xl text-sm font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                Marcar atendido
              </button>
              <button
                onClick={() => {
                  setFlyTarget([selected.lat, selected.lng]);
                  setSelected(null);
                }}
                className="h-11 flex-1 rounded-xl border text-sm font-bold"
                style={{ borderColor: "var(--border)" }}
              >
                Ver en mapa
              </button>
            </div>
          </div>
        </div>
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
