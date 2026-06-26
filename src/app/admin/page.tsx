"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { usePresence } from "@/hooks/usePresence";
import { useTheme } from "@/lib/theme";
import { ReportRow } from "@/components/ReportRow";

const ReportMap = dynamic(() => import("@/components/ReportMap"), { ssr: false });

const NAV = [
  { id: "resumen", icon: "📊", label: "Resumen" },
  { id: "reportes", icon: "📋", label: "Reportes" },
  { id: "moderacion", icon: "🛡️", label: "Moderación" },
  { id: "mapa", icon: "🗺️", label: "Mapa operativo" },
  { id: "ia", icon: "✦", label: "Asistente IA" },
  { id: "usuarios", icon: "👥", label: "Usuarios" },
] as const;

type Section = (typeof NAV)[number]["id"];

export default function AdminPage() {
  const { reports, moderate } = useReports();
  const connectedUsers = usePresence();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>("resumen");

  const pending = useMemo(() => reports.filter((r) => r.status === "sin_verificar"), [reports]);

  const statCards = useMemo(() => {
    const byStatus = (s: string) => reports.filter((r) => r.status === s).length;
    return [
      { icon: "📋", label: "Total reportes", value: reports.length },
      { icon: "🆘", label: "Sin verificar", value: byStatus("sin_verificar") },
      { icon: "🔄", label: "En proceso", value: byStatus("en_proceso") },
      { icon: "✓", label: "Verificados", value: byStatus("verificado") },
      { icon: "⚑", label: "Falsos", value: byStatus("falso") },
    ];
  }, [reports]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-sm font-bold" style={{ color: "var(--muted)" }}>‹ App</Link>
          <div className="text-sm font-extrabold">Centro de operaciones</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>{connectedUsers} conectado(s)</span>
          <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-lg border" style={{ borderColor: "var(--border)" }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className="flex w-56 flex-shrink-0 flex-col gap-1 p-4"
          style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}
        >
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold"
              style={{
                background: section === n.id ? "var(--accent-soft)" : "transparent",
                color: section === n.id ? "var(--accent)" : "var(--fg-2)",
              }}
            >
              <span className="w-5 text-center">{n.icon}</span>
              {n.label}
              {n.id === "reportes" && pending.length > 0 && (
                <span className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] text-white" style={{ background: "var(--accent)" }}>
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {section === "resumen" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
                {statCards.map((s) => (
                  <div key={s.label} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="mb-2 text-lg">{s.icon}</div>
                    <div className="text-2xl font-extrabold">{s.value}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)", minHeight: 420 }}>
                  <ReportMap
                    reports={reports}
                    theme={theme}
                    base="streets"
                    center={[10.606, -66.91]}
                    flyTarget={null}
                    onSelect={() => {}}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="px-4 py-3 text-sm font-extrabold" style={{ borderBottom: "1px solid var(--border)" }}>
                    Reportes recientes
                  </div>
                  {reports.slice(0, 8).map((r) => (
                    <ReportRow
                      key={r.id}
                      report={r}
                      onVerify={() => moderate(r, "verify")}
                      onFalse={() => moderate(r, "false")}
                      onDelete={() => moderate(r, "delete")}
                    />
                  ))}
                  {reports.length === 0 && (
                    <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>Sin reportes todavía.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === "reportes" && (
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm font-extrabold">Todos los reportes</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{reports.length} en total</span>
              </div>
              {reports.map((r) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  onVerify={() => moderate(r, "verify")}
                  onFalse={() => moderate(r, "false")}
                  onDelete={() => moderate(r, "delete")}
                />
              ))}
              {reports.length === 0 && (
                <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>Sin reportes todavía.</div>
              )}
            </div>
          )}

          {section === "moderacion" && (
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm font-extrabold">Pendientes de verificar</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{pending.length} reporte(s)</span>
              </div>
              {pending.map((r) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  onVerify={() => moderate(r, "verify")}
                  onFalse={() => moderate(r, "false")}
                  onDelete={() => moderate(r, "delete")}
                />
              ))}
              {pending.length === 0 && (
                <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>No hay reportes pendientes de moderación. 🎉</div>
              )}
            </div>
          )}

          {(section === "mapa" || section === "ia" || section === "usuarios") && (
            <div className="rounded-2xl border p-10 text-center text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
              {section === "mapa"
                ? 'El mapa operativo se muestra en la sección "Resumen" — esta vista dedicada está en construcción.'
                : "Esta sección todavía no está implementada."}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
