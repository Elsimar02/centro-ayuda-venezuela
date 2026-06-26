"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { usePresence } from "@/hooks/usePresence";
import { useTheme } from "@/lib/theme";
import { ReportRow } from "@/components/ReportRow";
import { ReportForm } from "@/components/ReportForm";
import { ReportDetailPanel } from "@/components/ReportDetailPanel";
import { Report } from "@/lib/types";

const ReportMap = dynamic(() => import("@/components/ReportMap"), { ssr: false });

const SCENARIO_CITY = "La Guaira";

const NAV = [
  { id: "resumen", icon: "📊", label: "Resumen" },
  { id: "reportes", icon: "📋", label: "Reportes" },
  { id: "moderacion", icon: "🛡️", label: "Moderación" },
  { id: "mapa", icon: "🗺️", label: "Mapa operativo" },
  { id: "grupos", icon: "💬", label: "Grupos de comunicación" },
  { id: "ia", icon: "✦", label: "Asistente IA" },
  { id: "usuarios", icon: "👥", label: "Usuarios" },
] as const;

const COMM_GROUPS = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "🟢",
    desc: "Coordinación en tiempo real entre voluntarios y reporteros.",
    url: "https://chat.whatsapp.com/Kqqyyuq5vfmD5Aq879D4aQ?s=cl&p=i&mlu=0",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "🔵",
    desc: "Canal de difusión y respaldo del grupo de WhatsApp.",
    url: "https://t.me/+Psx3v3u6WS1mODZh",
  },
] as const;

type Section = (typeof NAV)[number]["id"];

export default function AdminPage() {
  const { reports, moderate, submit } = useReports();
  const connectedUsers = usePresence();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>("resumen");
  const [showReport, setShowReport] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);

  const pending = useMemo(() => reports.filter((r) => r.status === "sin_verificar"), [reports]);
  const selectedReport = selected ? reports.find((r) => r.id === selected.id) ?? selected : null;

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
        className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-3.5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Link href="/" className="flex-shrink-0 text-sm font-bold" style={{ color: "var(--muted)" }}>‹ App</Link>
          <VenezuelaFlag />
          <div className="truncate text-sm font-extrabold">Centro de operaciones</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden text-xs font-bold sm:inline" style={{ color: "var(--muted)" }}>{connectedUsers} conectado(s)</span>
          <span
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold sm:hidden"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            ● {connectedUsers}
          </span>
          <button
            onClick={() => setShowReport(true)}
            className="hidden h-9 items-center rounded-lg px-3.5 text-xs font-extrabold text-white sm:flex"
            style={{ background: "var(--accent)" }}
          >
            + Reportar
          </button>
          <button onClick={toggleTheme} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: "var(--border)" }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <nav
        className="sticky top-[57px] z-20 flex gap-2 overflow-x-auto px-3 py-2 md:hidden"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setSection(n.id)}
            className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold whitespace-nowrap"
            style={{
              background: section === n.id ? "var(--accent)" : "var(--surface-2)",
              color: section === n.id ? "#fff" : "var(--fg-2)",
            }}
          >
            <span>{n.icon}</span>
            {n.label}
            {n.id === "reportes" && pending.length > 0 && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px]"
                style={{ background: section === n.id ? "rgba(255,255,255,.25)" : "var(--accent)", color: "#fff" }}
              >
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex flex-1">
        <aside
          className="hidden w-56 flex-shrink-0 flex-col gap-1 p-4 md:flex"
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

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6">
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
                    center={[8, -66]}
                    zoom={6}
                    flyTarget={null}
                    onSelect={setSelected}
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
                      onClick={() => setSelected(r)}
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
                  onClick={() => setSelected(r)}
                  key={r.id}
                  report={r}
                  onClick={() => setSelected(r)}
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
            <div className="flex flex-col gap-4">
              <a
                href="mailto:Centrocooperativovenezuela@gmail.com?subject=Reporte%20de%20error%20o%20contacto%20con%20moderaci%C3%B3n"
                className="flex items-center gap-3 rounded-2xl border p-4"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <span className="text-2xl">✉️</span>
                <span className="flex-1">
                  <span className="block text-sm font-extrabold">¿Encontraste un error o necesitás contactar a un moderador?</span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>
                    Escribinos a Centrocooperativovenezuela@gmail.com
                  </span>
                </span>
                <span
                  className="inline-flex h-9 flex-shrink-0 items-center rounded-lg px-3.5 text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  Enviar correo
                </span>
              </a>

            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm font-extrabold">Pendientes de verificar</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{pending.length} reporte(s)</span>
              </div>
              {pending.map((r) => (
                <ReportRow
                  onClick={() => setSelected(r)}
                  key={r.id}
                  report={r}
                  onClick={() => setSelected(r)}
                  onVerify={() => moderate(r, "verify")}
                  onFalse={() => moderate(r, "false")}
                  onDelete={() => moderate(r, "delete")}
                />
              ))}
              {pending.length === 0 && (
                <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>No hay reportes pendientes de moderación. 🎉</div>
              )}
            </div>
            </div>
          )}

          {section === "mapa" && (
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--border)", background: "var(--surface)", height: "calc(100vh - 160px)" }}
            >
              <ReportMap
                reports={reports}
                theme={theme}
                base="streets"
                center={[10.606, -66.91]}
                flyTarget={null}
                onSelect={(r) => setSelected(r)}
              />
            </div>
          )}

          {section === "grupos" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {COMM_GROUPS.map((g) => (
                <a
                  key={g.id}
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-3 rounded-2xl border p-5"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{g.icon}</span>
                    <span className="text-base font-extrabold">{g.name}</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--fg-2)" }}>{g.desc}</p>
                  <span
                    className="mt-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    Unirse al grupo
                  </span>
                </a>
              ))}
            </div>
          )}

          {(section === "ia" || section === "usuarios") && (
            <div className="rounded-2xl border p-10 text-center text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
              Esta sección todavía no está implementada.
            </div>
          )}
        </main>
      </div>

      <button
        onClick={() => setShowReport(true)}
        className="fixed bottom-5 right-4 z-30 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-extrabold text-white shadow-lg sm:hidden"
        style={{ background: "var(--accent)" }}
      >
        + Reportar
      </button>

      {showReport && (
        <ReportForm
          scenarioCity={SCENARIO_CITY}
          onClose={() => setShowReport(false)}
          onSubmit={(draft) => submit(draft, SCENARIO_CITY, false)}
        />
      )}

      {selectedReport && (
        <ReportDetailPanel
          report={selectedReport}
          onClose={() => setSelected(null)}
          onVerify={() => moderate(selectedReport, "verify")}
          onFalse={() => moderate(selectedReport, "false")}
        />
      )}
    </div>
  );
}

function VenezuelaFlag() {
  // Estrellas en arco (8 estrellas blancas sobre la franja azul)
  const stars = Array.from({ length: 8 }, (_, i) => {
    const angle = Math.PI + (i / 7) * Math.PI; // arco inferior
    const cx = 11 + Math.cos(angle) * 6;
    const cy = 9.5 + Math.sin(angle) * 2.6;
    return <circle key={i} cx={cx} cy={cy} r={0.7} fill="#fff" />;
  });
  return (
    <svg
      width="22"
      height="16"
      viewBox="0 0 22 16"
      role="img"
      aria-label="Bandera de Venezuela"
      className="flex-shrink-0 rounded-[3px]"
      style={{ boxShadow: "0 0 0 1px var(--border)" }}
    >
      <rect width="22" height="16" rx="2" fill="#fff" />
      <clipPath id="vflag">
        <rect width="22" height="16" rx="2" />
      </clipPath>
      <g clipPath="url(#vflag)">
        <rect width="22" height="5.34" y="0" fill="#FCDD09" />
        <rect width="22" height="5.34" y="5.33" fill="#003893" />
        <rect width="22" height="5.34" y="10.66" fill="#CF142B" />
        {stars}
      </g>
    </svg>
  );
}
