"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { usePresence } from "@/hooks/usePresence";
import { useTheme } from "@/lib/theme";
import { ReportRow } from "@/components/ReportRow";
import { ReportForm } from "@/components/ReportForm";
import { ReportDetailPanel } from "@/components/ReportDetailPanel";
import { CitizenMapView } from "@/components/CitizenMapView";
import { MAP_FILTERS, Report, ReportType } from "@/lib/types";
import { telLink } from "@/lib/contact";

const ReportMap = dynamic(() => import("@/components/ReportMap"), { ssr: false });

const NAV = [
  { id: "resumen", icon: "📊", label: "Resumen" },
  { id: "reportes", icon: "📋", label: "Reportes" },
  { id: "moderacion", icon: "🛡️", label: "Moderación" },
  { id: "mapa", icon: "🗺️", label: "Mapa operativo" },
  { id: "grupos", icon: "💬", label: "Grupos de comunicación" },
  { id: "donaciones", icon: "💜", label: "Donaciones" },
  { id: "telefonos", icon: "☎️", label: "Teléfonos de emergencia" },
  { id: "tutorial", icon: "📖", label: "Tutorial" },
] as const;

const COMM_GROUPS = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "🟢",
    desc: "Coordinación en tiempo real entre voluntarios y reporteros.",
    url: "https://chat.whatsapp.com/Kqqyyuq5vfmD5Aq879D4aQ?s=cl&p=i&mlu=0",
    cta: "Unirse al grupo",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "🔵",
    desc: "Canal de difusión y respaldo del grupo de WhatsApp.",
    url: "https://t.me/+Psx3v3u6WS1mODZh",
    cta: "Unirse al canal",
  },
  {
    id: "venezuela-te-busca",
    name: "Venezuela Te Busca",
    icon: "🔎",
    desc: "Plataforma ciudadana para registrar y buscar personas desaparecidas tras el terremoto.",
    url: "https://www.desaparecidosvenezuela.com/",
    cta: "Buscar o registrar a alguien",
  },
] as const;

const DONATION_LINKS = [
  {
    id: "yummy",
    name: "Yummy",
    icon: "💜",
    desc: "Yummy (la empresa de delivery y transporte más grande de Venezuela) hace matching del 25% de tu donación, hasta $100,000.",
    url: "https://dona.yummyrides.com",
    cta: "Donar en Yummy",
  },
  {
    id: "caritas",
    name: "Cáritas Venezuela",
    icon: "⛪",
    desc: "Organización de promoción y asistencia social de la Iglesia Católica en Venezuela.",
    url: "https://caritasvenezuela.org/donaciones/",
    cta: "Donar en Cáritas",
  },
  {
    id: "hogar-bambi",
    name: "Hogar Bambi Venezuela",
    icon: "🧒",
    desc: "Vía GlobalGiving: atención integral (salud, educación, alimentación, protección legal) a 120 niños huérfanos o abandonados en Caracas.",
    url: "https://www.globalgiving.org/projects/integral-support-program-for-children/",
    cta: "Donar en GlobalGiving",
  },
] as const;

// Fuente: redayudavenezuela.com
const HOSPITALS_CARACAS = [
  { name: "Hospital José Gregorio Hernández (Los Magallanes)", phones: ["(0212) 870.78.97"] },
  { name: "Hospital Miguel Pérez Carreño (Bella Vista)", phones: ["(0212) 472.84.72"] },
  { name: "Hospital Militar (San Martín)", phones: ["(0212) 406.12.41"] },
  { name: "Hospital Periférico de Catia (Catia)", phones: ["(0212) 870.27.71"] },
  { name: "Hospital Periférico de Coche (Coche)", phones: ["(0212) 681.11.33"] },
  { name: "Policlínica David Lobo (Santa Rosalía)", phones: ["(0212) 541.54.65"] },
  { name: "Policlínica La Arboleda (San Bernardino)", phones: ["(0212) 550.18.11"] },
  { name: "Policlínica Las Mercedes (Las Mercedes)", phones: ["(0212) 993.23.23"] },
  { name: "Policlínica Santiago de León (Sabana Grande)", phones: ["(0212) 762.90.25"] },
] as const;

const EMERGENCY_LINES = [
  { name: "Cantv (desde fijo)", phones: ["171"] },
  { name: "Movilnet", phones: ["*1"] },
  { name: "Digitel", phones: ["112"] },
  { name: "Movistar", phones: ["911"] },
] as const;

const AMBULANCES = [
  { name: "Aeroambulancias", phones: ["(0212) 993.25.41", "(0212) 992.89.80", "(0212) 992.89.90", "(0212) 991.79.40"] },
  { name: "Rescarven", phones: ["(0212) 993.69.11", "(0212) 993.69.91", "(0212) 993.13.10", "(0212) 993.33.67"] },
  { name: "Servicio de Ambulancia Metropolitano", phones: ["(0212) 545.45.45", "(0212) 545.46.55", "(0212) 577.92.09"] },
] as const;

const FIREFIGHTERS = [
  { name: "Antímano", phones: ["(0212) 472.20.54"] },
  { name: "Catia la Mar", phones: ["(0212) 351.99.66"] },
  { name: "Chacao", phones: ["(0212) 265.32.61"] },
  { name: "del Este (Cafetal)", phones: ["(0212) 987.43.34", "(0212) 985.50.60"] },
  { name: "Sucre", phones: ["(0212) 985.36.40"] },
  { name: "El Cafetal", phones: ["(0212) 985.36.40", "(0212) 985.29.77"] },
  { name: "El Paraíso", phones: ["(0212) 481.09.61"] },
  { name: "El Valle", phones: ["(0212) 672.01.75", "(0212) 672.06.36"] },
  { name: "La Guaira", phones: ["(0212) 332.76.20", "(0212) 331.04.45"] },
  { name: "La Trinidad", phones: ["(0212) 943.43.61"] },
  { name: "La Urbina", phones: ["(0212) 241.66.41"] },
  { name: "Metropolitanos", phones: ["(0212) 545.45.45"] },
  { name: "Miranda", phones: ["(0212) 235.69.67"] },
  { name: "Plaza Venezuela", phones: ["(0212) 793.00.39", "(0212) 793.64.57"] },
  { name: "San Bernardino", phones: ["(0212) 577.92.09"] },
] as const;

type Section = (typeof NAV)[number]["id"];

export function Dashboard({ canModerate }: { canModerate: boolean }) {
  const { reports, moderate, submit, verify } = useReports();
  const connectedUsers = usePresence();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>("resumen");
  const [showReport, setShowReport] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const pending = useMemo(() => reports.filter((r) => r.status === "sin_verificar"), [reports]);
  const selectedReport = selected ? reports.find((r) => r.id === selected.id) ?? selected : null;

  const [reportFilter, setReportFilter] = useState("todos");
  const filteredReports = useMemo(() => {
    const def = MAP_FILTERS.find((f) => f.id === reportFilter);
    if (!def || def.types === "todos") return reports;
    return reports.filter((r) => (def.types as ReportType[]).includes(r.type));
  }, [reports, reportFilter]);

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

  // Las acciones de moderar (verificar/marcar falso/eliminar) solo existen en /admin.
  // En la página pública, un reporte se "marca" con confirm/attended/incorrect (verify),
  // que es la verificación ciudadana, no una acción de moderador.
  function rowActions(r: Report) {
    return canModerate
      ? {
          onVerify: () => moderate(r, "verify"),
          onFalse: () => moderate(r, "false"),
          onDelete: () => moderate(r, "delete"),
        }
      : {};
  }

  const detailActions = selectedReport
    ? canModerate
      ? {
          onVerify: () => moderate(selectedReport, "verify"),
          onFalse: () => moderate(selectedReport, "false"),
        }
      : {
          onVerify: () => verify(selectedReport, "confirm"),
          onFalse: () => verify(selectedReport, "incorrect"),
          onAttended: () => verify(selectedReport, "attended"),
        }
    : {};

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-3.5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-base md:hidden"
            style={{ borderColor: "var(--border)" }}
          >
            ☰
          </button>
          <VenezuelaFlag />
          <div className="truncate text-sm font-extrabold">Centro de Coordinación</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden text-xs font-bold sm:inline" style={{ color: "var(--muted)" }}>{connectedUsers} conectado(s)</span>
          <span
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold sm:hidden"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            ● {connectedUsers}
          </span>
          <button type="button"
            onClick={() => setShowReport(true)}
            className="hidden h-9 items-center rounded-lg px-3.5 text-xs font-extrabold text-white sm:flex"
            style={{ background: "var(--accent)" }}
          >
            + Reportar
          </button>
          <button type="button" onClick={toggleTheme} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: "var(--border)" }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <nav
        className="sticky top-[57px] z-20 flex gap-2 overflow-x-auto px-3 py-2 md:hidden"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        {NAV.map((n) => (
          <button type="button"
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
          <NavList section={section} pending={pending.length} onSelect={setSection} />
        </aside>

        {navOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" aria-modal>
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{ background: "rgba(0,0,0,.4)" }}
              onClick={() => setNavOpen(false)}
            />
            <div
              className="relative flex h-full w-64 flex-col gap-1 p-4"
              style={{ background: "var(--surface)" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-extrabold">Menú</span>
                <button type="button" onClick={() => setNavOpen(false)} aria-label="Cerrar menú" className="text-xl">×</button>
              </div>
              <NavList
                section={section}
                pending={pending.length}
                onSelect={(id) => {
                  setSection(id);
                  setNavOpen(false);
                }}
              />
            </div>
          </div>
        )}

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
                <div className="flex flex-col gap-3">
                  <FilterChips value={reportFilter} onChange={setReportFilter} />
                  <div
                    className="relative cursor-pointer overflow-hidden rounded-2xl border"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", minHeight: 420 }}
                    onClick={() => setShowFullMap(true)}
                  >
                    <ReportMap
                      reports={filteredReports}
                      theme={theme}
                      base="streets"
                      center={[8, -66]}
                      zoom={6}
                      flyTarget={null}
                      onSelect={setSelected}
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="px-4 py-3 text-sm font-extrabold" style={{ borderBottom: "1px solid var(--border)" }}>
                    Reportes recientes
                  </div>
                  {reports.slice(0, 8).map((r) => (
                    <ReportRow key={r.id} report={r} onClick={() => setSelected(r)} {...rowActions(r)} />
                  ))}
                  {reports.length === 0 && (
                    <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>Sin reportes todavía.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section === "reportes" && (
            <div className="flex flex-col gap-3">
              <FilterChips value={reportFilter} onChange={setReportFilter} />
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-sm font-extrabold">Todos los reportes</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{filteredReports.length} en total</span>
                </div>
                {filteredReports.map((r) => (
                  <ReportRow key={r.id} report={r} onClick={() => setSelected(r)} {...rowActions(r)} />
                ))}
                {filteredReports.length === 0 && (
                  <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>Sin reportes para este filtro.</div>
                )}
              </div>
            </div>
          )}

          {section === "moderacion" && (
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
          )}

          {section === "mapa" && (
            <div className="flex flex-col gap-3">
              <FilterChips value={reportFilter} onChange={setReportFilter} />
              <div
                className="cursor-pointer overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--border)", background: "var(--surface)", height: "calc(100vh - 210px)" }}
                onClick={() => setShowFullMap(true)}
              >
                <ReportMap
                  reports={filteredReports}
                  theme={theme}
                  base="streets"
                  center={[8, -66]}
                  zoom={6}
                  flyTarget={null}
                  onSelect={(r) => setSelected(r)}
                />
              </div>
            </div>
          )}

          {section === "grupos" && <LinkCardGrid items={COMM_GROUPS} />}

          {section === "donaciones" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Plataformas para donar desde fuera de Venezuela, recomendadas por voluntarios en redes.
              </p>
              <LinkCardGrid items={DONATION_LINKS} />
            </div>
          )}

          {section === "telefonos" && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Directorio de hospitales y líneas de emergencia. Fuente:{" "}
                <a href="https://redayudavenezuela.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">
                  redayudavenezuela.com
                </a>
              </p>
              <PhoneGroup title="🏥 Hospitales en Caracas" entries={HOSPITALS_CARACAS} />
              <PhoneGroup title="🚨 Emergencias (línea directa)" entries={EMERGENCY_LINES} />
              <PhoneGroup title="🚑 Ambulancias" entries={AMBULANCES} />
              <PhoneGroup title="🚒 Bomberos" entries={FIREFIGHTERS} />
            </div>
          )}

          {section === "tutorial" && <Tutorial />}
        </main>
      </div>

      <button type="button"
        onClick={() => setShowReport(true)}
        className="fixed bottom-5 right-4 z-30 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-extrabold text-white shadow-lg sm:hidden"
        style={{ background: "var(--accent)" }}
      >
        + Reportar
      </button>

      {showReport && (
        <ReportForm
          onClose={() => setShowReport(false)}
          onSubmit={(draft) => submit(draft, false)}
        />
      )}

      {selectedReport && (
        <ReportDetailPanel
          report={selectedReport}
          onClose={() => setSelected(null)}
          onResolved={() => verify(selectedReport, "resolved")}
          {...detailActions}
        />
      )}

      {showFullMap && <CitizenMapView onClose={() => setShowFullMap(false)} />}
    </div>
  );
}

function NavList({
  section,
  pending,
  onSelect,
}: {
  section: Section;
  pending: number;
  onSelect: (id: Section) => void;
}) {
  return (
    <>
      {NAV.map((n) => (
        <button type="button"
          key={n.id}
          onClick={() => onSelect(n.id)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold"
          style={{
            background: section === n.id ? "var(--accent-soft)" : "transparent",
            color: section === n.id ? "var(--accent)" : "var(--fg-2)",
          }}
        >
          <span className="w-5 text-center">{n.icon}</span>
          {n.label}
          {n.id === "reportes" && pending > 0 && (
            <span className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] text-white" style={{ background: "var(--accent)" }}>
              {pending}
            </span>
          )}
        </button>
      ))}
    </>
  );
}

function FilterChips({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
      {MAP_FILTERS.map((f) => (
        <button
          type="button"
          key={f.id}
          onClick={() => onChange(f.id)}
          className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold"
          style={{
            background: value === f.id ? "var(--accent)" : "var(--surface)",
            color: value === f.id ? "#fff" : "var(--fg)",
            borderColor: value === f.id ? "var(--accent)" : "var(--border)",
          }}
        >
          <span>{f.emoji}</span>
          {f.label}
        </button>
      ))}
    </div>
  );
}

function PhoneGroup({
  title,
  entries,
}: {
  title: string;
  entries: readonly { name: string; phones: readonly string[] }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="px-4 py-3 text-sm font-extrabold" style={{ borderBottom: "1px solid var(--border)" }}>
        {title}
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {entries.map((e) => (
          <div key={e.name} className="rounded-xl border p-3.5" style={{ borderColor: "var(--border-2)" }}>
            <div className="mb-2 text-sm font-bold">{e.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {e.phones.map((p) => (
                <a
                  key={p}
                  href={telLink(p)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  📞 {p}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkCardGrid({
  items,
}: {
  items: readonly { id: string; name: string; icon: string; desc: string; url: string; cta: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-3 rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-base font-extrabold">{item.name}</span>
          </div>
          <p className="text-sm" style={{ color: "var(--fg-2)" }}>{item.desc}</p>
          <span
            className="mt-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            {item.cta}
          </span>
        </a>
      ))}
    </div>
  );
}

const TUTORIAL_STEPS = [
  {
    img: "/tutorial/01-resumen.png",
    title: "1. Mira el resumen",
    text: "Al entrar ves cuántos reportes hay, cuáles faltan por confirmar, y los más recientes. Es lo primero que ve cualquier persona.",
  },
  {
    img: "/tutorial/02-mapa.png",
    title: "2. Mira el mapa",
    text: "Toca \"Mapa operativo\" para ver todos los reportes ubicados en Venezuela. Cada color es un tipo distinto de reporte. Puedes filtrar por categoría arriba.",
  },
  {
    img: "/tutorial/03-elegir-tipo.png",
    title: "3. Toca \"+ Reportar\"",
    text: "Elige qué quieres reportar: una persona atrapada o desaparecida, un refugio, un hospital que necesita insumos, una mascota perdida, etc.",
  },
  {
    img: "/tutorial/05-referencia.png",
    title: "4. Di dónde fue",
    text: "Tienes 3 opciones: usar tu ubicación GPS, escribir la dirección exacta, o si no la sabes, escribir una referencia (\"cerca de la plaza\") y marcar el lugar en un mapita.",
  },
  {
    img: "/tutorial/06-detalles.png",
    title: "5. Cuéntanos qué pasó",
    text: "Completa los datos que te pide (cambian según el tipo de reporte) y agrega una foto si tienes una. Todo lo que no sepas, puedes dejarlo en blanco.",
  },
  {
    img: "/tutorial/07-revisar.png",
    title: "6. Revisa y envía",
    text: "Confirma que todo esté bien y presiona \"Enviar reporte\". Listo — ya aparece en el mapa para que todos lo vean al instante.",
  },
  {
    img: "/tutorial/08-verificar.png",
    title: "7. Ayuda confirmando reportes",
    text: "Toca cualquier reporte para ver sus detalles. Si sabes que es cierto, presiona \"Verificado\". Si ya fue atendido, \"Marcar atendido\". Si crees que es falso, \"Falso\". Cuando la situación ya se resolvió, presiona \"Ya está resuelto\" — cuando 8 personas confirman esto, el reporte se puede quitar del mapa.",
  },
] as const;

function Tutorial() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="mb-2 text-lg font-extrabold">¿Qué es esta plataforma?</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
          Es un mapa hecho por ciudadanos para ayudar después de los terremotos en Venezuela. Cualquier
          persona puede reportar y ver, en tiempo real: gente atrapada o desaparecida, vías bloqueadas,
          hospitales y refugios, centros de acopio, y mascotas perdidas. No necesitas crear una cuenta ni
          dar tus datos para usarla.
        </p>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="mb-2 text-lg font-extrabold">¿Para qué sirve?</h2>
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
          <li>🆘 Pedir ayuda si tú o alguien cerca está en peligro</li>
          <li>🟢 Avisar si encontraste a una persona o una mascota</li>
          <li>💧 Decir dónde hay agua, comida, medicinas o un refugio</li>
          <li>✓ Confirmar reportes de otras personas para que sean más confiables</li>
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-extrabold">Cómo funciona, paso a paso</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TUTORIAL_STEPS.map((s) => (
            <div key={s.title} className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <Image src={s.img} alt={s.title} width={390} height={844} className="w-full" style={{ height: "auto" }} />
              <div className="p-4">
                <div className="mb-1.5 font-extrabold">{s.title}</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="mb-2 text-lg font-extrabold">Consejos</h2>
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
          <li>No necesitas crear cuenta ni iniciar sesión para reportar.</li>
          <li>Puedes reportar sin dar tu nombre. Si dejas un teléfono, otros podrán contactarte por esa vía.</li>
          <li>Si no tienes internet en el momento, activa &quot;Modo offline&quot; antes de reportar — se enviará apenas vuelva la señal.</li>
        </ul>
      </div>
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
