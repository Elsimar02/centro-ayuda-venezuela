"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { QuieroAyudarForm } from "@/components/QuieroAyudarForm";
import { MarketplaceDetailPanel, MarketplaceItem } from "@/components/MarketplaceDetailPanel";
import { waLink, telLink } from "@/lib/contact";
import { useTheme } from "@/lib/theme";
import { useDemanoCentros } from "@/hooks/useDemanoCentros";
import { DemanoCentro, demanoPlace } from "@/lib/demano";
import {
  AidProvider,
  KIND_CONFIG,
  NeedEntry,
  PROVIDER_KINDS,
  ProviderKind,
  RESOURCES,
  RESOURCE_MAP,
  distanceKm,
  fetchMisfiledNeedReports,
  fetchNeedEntries,
  fetchProviders,
  needResourceEmoji,
  needResourceLabel,
  resourceEmoji,
  resourceLabel,
} from "@/lib/marketplace";

const MarketplaceMap = dynamic(() => import("@/components/MarketplaceMap"), { ssr: false });

type Mode = "todos" | "ofrecen" | "necesitan";
type View = "catalogo" | "mapa";

export function MarketplaceView() {
  const { theme } = useTheme();
  const [view, setView] = useState<View>("catalogo");
  const [providers, setProviders] = useState<AidProvider[]>([]);
  const [needEntries, setNeedEntries] = useState<NeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<Mode>("todos");
  const [kindFilter, setKindFilter] = useState<ProviderKind | "todos">("todos");
  const [resourceFilter, setResourceFilter] = useState<string | "todos">("todos");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [showOffersLayer, setShowOffersLayer] = useState(true);
  const [showNeedsLayer, setShowNeedsLayer] = useState(true);
  const [selected, setSelected] = useState<MarketplaceItem | null>(null);
  const { centros: demanoCentros, loading: loadingDemano } = useDemanoCentros(view === "catalogo");

  async function load() {
    setLoading(true);
    try {
      const [p, n, m] = await Promise.all([fetchProviders(), fetchNeedEntries(), fetchMisfiledNeedReports()]);
      setProviders(p);
      setNeedEntries([...n, ...m]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const [p, n, m] = await Promise.all([
        fetchProviders().catch(() => [] as AidProvider[]),
        fetchNeedEntries().catch(() => [] as NeedEntry[]),
        fetchMisfiledNeedReports().catch(() => [] as NeedEntry[]),
      ]);
      if (!ignore) {
        setProviders(p);
        setNeedEntries([...n, ...m]);
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = providers.filter((p) => p.status === "activo");
    if (mode === "ofrecen") list = list.filter((p) => p.offers.length > 0);
    if (mode === "necesitan") list = list.filter((p) => p.needs.length > 0);
    if (kindFilter !== "todos") list = list.filter((p) => p.kind === kindFilter);
    if (resourceFilter !== "todos")
      list = list.filter(
        (p) =>
          (mode !== "necesitan" && p.offers.includes(resourceFilter)) ||
          (mode !== "ofrecen" && p.needs.includes(resourceFilter))
      );
    if (q)
      list = list.filter((p) =>
        [p.name, p.place, p.notes, ...p.offers.map(resourceLabel), ...p.needs.map(resourceLabel)]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    if (userLoc)
      list = [...list].sort((a, b) => distanceKm(userLoc, a) - distanceKm(userLoc, b));
    return list;
  }, [providers, search, mode, kindFilter, resourceFilter, userLoc]);

  // Necesidades humanitarias (módulo aparte) que también caben en la vista
  // "necesitan": solo aplica búsqueda y kindFilter no las afecta (no tienen tipo
  // de colaborador) y resourceFilter usa claves propias, así que solo filtramos
  // por texto cuando el usuario busca algo.
  const filteredNeeds = useMemo(() => {
    if (mode === "ofrecen") return [];
    const q = search.trim().toLowerCase();
    let list = needEntries;
    if (q)
      list = list.filter((n) =>
        [n.name, n.place, n.notes, ...n.needs.map(needResourceLabel)].join(" ").toLowerCase().includes(q)
      );
    if (userLoc)
      list = [...list]
        .filter((n) => n.lat != null && n.lng != null)
        .sort((a, b) => distanceKm(userLoc, a as { lat: number; lng: number }) - distanceKm(userLoc, b as { lat: number; lng: number }));
    return list;
  }, [needEntries, search, mode, userLoc]);

  // Recursos presentes en el directorio (para no llenar el filtro de opciones vacías).
  const presentResources = useMemo(() => {
    const set = new Set<string>();
    providers.forEach((p) => [...p.offers, ...p.needs].forEach((k) => set.add(k)));
    return RESOURCES.filter((r) => set.has(r.key));
  }, [providers]);

  const stats = useMemo(() => {
    const active = providers.filter((p) => p.status === "activo");
    return {
      total: active.length,
      ofrecen: active.filter((p) => p.offers.length > 0).length,
      necesitan: active.filter((p) => p.needs.length > 0).length + needEntries.length,
    };
  }, [providers, needEntries]);

  return (
    <div className="flex flex-col gap-5">
      {/* Hero + botón grande */}
      <div
        className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
        style={{ background: "var(--accent-soft)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-2xl font-extrabold" style={{ color: "var(--fg)" }}>
          Quiero Ayudar
        </h2>
        <p className="max-w-xl text-sm" style={{ color: "var(--muted)" }}>
          Conecta a quien necesita ayuda con personas, empresas, ONG, iglesias, voluntarios e
          instituciones que pueden ofrecer recursos. Regístrate y di qué ofreces o qué necesitas.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-1 h-14 rounded-2xl px-10 text-lg font-extrabold text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          🤝 QUIERO AYUDAR
        </button>
        <div className="mt-1 flex gap-5 text-xs font-semibold" style={{ color: "var(--fg-2)" }}>
          <span>{stats.total} colaboradores</span>
          <span>🟢 {stats.ofrecen} ofrecen</span>
          <span>🔴 {stats.necesitan} necesitan</span>
        </div>
      </div>

      {/* Toggle Catálogo / Mapa */}
      <div className="flex gap-2">
        {(["catalogo", "mapa"] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className="h-10 flex-1 rounded-xl border text-sm font-bold"
            style={
              view === v
                ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
                : { borderColor: "var(--border)", color: "var(--fg-2)" }
            }
          >
            {v === "catalogo" ? "📋 Catálogo" : "🗺️ Mapa"}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["todos", "ofrecen", "necesitan"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="h-9 rounded-full border px-4 text-sm font-bold capitalize"
              style={
                mode === m
                  ? { borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }
                  : { borderColor: "var(--border)", color: "var(--fg-2)" }
              }
            >
              {m === "ofrecen" ? "🟢 Ofrecen" : m === "necesitan" ? "🔴 Necesitan" : "Todos"}
            </button>
          ))}
          <button
            type="button"
            onClick={locateMe}
            className="ml-auto h-9 rounded-full border px-4 text-sm font-bold"
            style={{ borderColor: userLoc ? "var(--accent)" : "var(--border)", color: userLoc ? "var(--accent)" : "var(--fg-2)" }}
          >
            📍 {userLoc ? "Ordenado por cercanía" : "Cerca de mí"}
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, recurso o lugar..."
          aria-label="Buscar en el directorio"
          className="h-11 w-full rounded-xl border px-4 text-sm outline-none"
          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as ProviderKind | "todos")}
            aria-label="Filtrar por tipo de colaborador"
            className="h-9 rounded-lg border px-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
          >
            <option value="todos">Todos los tipos</option>
            {PROVIDER_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.emoji} {k.label}
              </option>
            ))}
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            aria-label="Filtrar por recurso"
            className="h-9 rounded-lg border px-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
          >
            <option value="todos">Todos los recursos</option>
            {presentResources.map((r) => (
              <option key={r.key} value={r.key}>
                {r.emoji} {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catálogo o mapa */}
      {loading ? (
        <p className="py-10 text-center text-sm" style={{ color: "var(--muted)" }}>Cargando directorio...</p>
      ) : view === "mapa" ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowOffersLayer((v) => !v)}
              className="h-9 rounded-full border px-3 text-xs font-bold"
              style={
                showOffersLayer
                  ? { borderColor: "#16a34a", background: "#16a34a1f", color: "#16a34a" }
                  : { borderColor: "var(--border)", color: "var(--fg-2)" }
              }
            >
              🟢 Recursos disponibles ({stats.ofrecen})
            </button>
            <button
              type="button"
              onClick={() => setShowNeedsLayer((v) => !v)}
              className="h-9 rounded-full border px-3 text-xs font-bold"
              style={
                showNeedsLayer
                  ? { borderColor: "#dc2626", background: "#dc26261f", color: "#dc2626" }
                  : { borderColor: "var(--border)", color: "var(--fg-2)" }
              }
            >
              🔴 Necesidades ({stats.necesitan})
            </button>
          </div>
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border)", height: "calc(100vh - 380px)", minHeight: 420 }}
          >
            <MarketplaceMap
              providers={filtered}
              needEntries={filteredNeeds}
              theme={theme}
              center={userLoc ? [userLoc.lat, userLoc.lng] : [8, -66]}
              zoom={userLoc ? 12 : 6}
              showOffers={showOffersLayer}
              showNeeds={showNeedsLayer}
              userLoc={userLoc}
            />
          </div>
        </div>
      ) : filtered.length === 0 && filteredNeeds.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-4xl">🫶</span>
          <p className="text-sm font-semibold" style={{ color: "var(--fg-2)" }}>
            {providers.length === 0 && needEntries.length === 0
              ? "Aún no hay colaboradores ni necesidades registradas. ¡Sé el primero en registrarte!"
              : "No hay resultados con esos filtros."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProviderCard key={p.id} provider={p} userLoc={userLoc} onOpen={() => setSelected({ kind: "provider", data: p })} />
          ))}
          {filteredNeeds.map((n) => (
            <NeedEntryCard key={n.id} entry={n} userLoc={userLoc} onOpen={() => setSelected({ kind: "need", data: n })} />
          ))}
        </div>
      )}

      {view === "catalogo" && mode !== "ofrecen" && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold" style={{ color: "var(--fg)" }}>
            🏥 Necesidades urgentes — De Mano en Mano Venezuela
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Insumos pendientes por cubrir en hospitales y centros, en vivo desde demanoenmanove.org.
          </p>
          {loadingDemano && (
            <div className="rounded-2xl border p-4 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              Cargando…
            </div>
          )}
          {!loadingDemano && demanoCentros.length === 0 && (
            <div className="rounded-2xl border p-4 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              No se pudo cargar la lista en este momento.
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {demanoCentros.map((c) => (
              <DemanoCentroCard key={c.id} centro={c} />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <QuieroAyudarForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            void load();
          }}
        />
      )}

      {selected && <MarketplaceDetailPanel item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ProviderCard({
  provider: p,
  userLoc,
  onOpen,
}: {
  provider: AidProvider;
  userLoc: { lat: number; lng: number } | null;
  onOpen: () => void;
}) {
  const k = KIND_CONFIG[p.kind];
  const wa = p.whatsapp ? waLink(p.whatsapp) : null;
  const dist = userLoc ? distanceKm(userLoc, p) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 text-left"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: "var(--surface-2)" }}>
          {k.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold" style={{ color: "var(--fg)" }}>{p.name}</div>
          <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            {k.label}
            {p.place ? ` · ${p.place}` : ""}
          </div>
          {dist != null && (
            <div className="text-xs font-bold" style={{ color: "var(--accent)" }}>
              a {dist < 1 ? "menos de 1" : Math.round(dist)} km
              {p.radius_km > 0 ? ` · entrega hasta ${p.radius_km} km` : ""}
            </div>
          )}
        </div>
        <span
          className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={
            p.availability === "inmediata"
              ? { background: "rgba(22,163,74,.15)", color: "#16a34a" }
              : { background: "rgba(217,119,6,.15)", color: "#d97706" }
          }
        >
          {p.availability === "inmediata" ? "Disponible ya" : "Programado"}
        </span>
      </div>

      {p.offers.length > 0 && (
        <ChipRow title="Ofrece" color="#16a34a" keys={p.offers} />
      )}
      {p.needs.length > 0 && (
        <ChipRow title="Necesita" color="#dc2626" keys={p.needs} />
      )}

      {(p.quantity || p.schedule) && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {p.quantity && <span className="font-semibold">{p.quantity}</span>}
          {p.quantity && p.schedule ? " · " : ""}
          {p.schedule}
        </p>
      )}
      {p.notes && <p className="text-xs" style={{ color: "var(--fg-2)" }}>{p.notes}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white"
            style={{ background: "#16a34a" }}
          >
            💬 WhatsApp
          </a>
        )}
        {p.phone && (
          <a
            href={telLink(p.phone)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            ☎️ Llamar
          </a>
        )}
        {p.email && (
          <a
            href={`mailto:${p.email}`}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            ✉️ Correo
          </a>
        )}
      </div>
    </div>
  );
}

function NeedEntryCard({
  entry: n,
  userLoc,
  onOpen,
}: {
  entry: NeedEntry;
  userLoc: { lat: number; lng: number } | null;
  onOpen: () => void;
}) {
  const wa = n.whatsapp ? waLink(n.whatsapp) : null;
  const dist = userLoc && n.lat != null && n.lng != null ? distanceKm(userLoc, { lat: n.lat, lng: n.lng }) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 text-left"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: "var(--surface-2)" }}>
          🆘
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold" style={{ color: "var(--fg)" }}>{n.name}</div>
          <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            {n.source === "reporte" ? "Reportado en el mapa" : "Necesidad humanitaria"}
            {n.place ? ` · ${n.place}` : ""}
          </div>
          {dist != null && (
            <div className="text-xs font-bold" style={{ color: "var(--accent)" }}>
              a {dist < 1 ? "menos de 1" : Math.round(dist)} km
            </div>
          )}
        </div>
        <span
          className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: "rgba(220,38,38,.15)", color: "#dc2626" }}
        >
          Necesita ayuda
        </span>
      </div>

      {n.needs.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Necesita
          </div>
          <div className="flex flex-wrap gap-1">
            {n.needs.map((key) => (
              <span
                key={key}
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: "#dc262614", color: "#dc2626" }}
              >
                {needResourceEmoji(key)} {needResourceLabel(key)}
              </span>
            ))}
          </div>
        </div>
      )}

      {n.notes && <p className="text-xs" style={{ color: "var(--fg-2)" }}>{n.notes}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white"
            style={{ background: "#16a34a" }}
          >
            💬 WhatsApp
          </a>
        )}
        {n.phone && (
          <a
            href={telLink(n.phone)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            ☎️ Llamar
          </a>
        )}
        {n.email && (
          <a
            href={`mailto:${n.email}`}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            ✉️ Correo
          </a>
        )}
      </div>
    </div>
  );
}

const URGENCIA_LABEL: Record<number, { label: string; color: string }> = {
  3: { label: "Urgente", color: "#dc2626" },
  2: { label: "Media", color: "#d97706" },
  1: { label: "Baja", color: "#16a34a" },
};

function DemanoCentroCard({ centro: c }: { centro: DemanoCentro }) {
  const place = demanoPlace(c);
  const maxUrgencia = Math.max(...c.necesidades.map((n) => n.urgencia));
  const urg = URGENCIA_LABEL[maxUrgencia] ?? { label: "Necesita ayuda", color: "#dc2626" };
  const shown = c.necesidades.slice(0, 8);
  const rest = c.necesidades.length - shown.length;
  const wa = c.whatsapp_publico ? waLink(c.whatsapp_publico) : null;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: "var(--surface-2)" }}>
          🏥
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold" style={{ color: "var(--fg)" }}>{c.nombre}</div>
          <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            {c.tipo}
            {place ? ` · ${place}` : ""}
          </div>
        </div>
        <span
          className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: `${urg.color}26`, color: urg.color }}
        >
          {urg.label}
        </span>
      </div>

      <div>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Necesita ({c.necesidades.length} {c.necesidades.length === 1 ? "ítem" : "ítems"})
        </div>
        <div className="flex flex-wrap gap-1">
          {shown.map((n) => (
            <span
              key={n.id}
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: "#dc262614", color: "#dc2626" }}
              title={n.categoria}
            >
              {n.item} ({n.cantidad_pedida - n.cantidad_cubierta})
            </span>
          ))}
          {rest > 0 && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
              +{rest} más
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white"
            style={{ background: "#16a34a" }}
          >
            💬 WhatsApp
          </a>
        )}
        {c.maps_url && (
          <a
            href={c.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          >
            📍 Ver mapa
          </a>
        )}
      </div>

      <div className="text-[11px] font-bold" style={{ color: "var(--muted)" }}>
        Fuente: demanoenmanove.org · actualizado {new Date(c.actualizado).toLocaleDateString("es-VE")}
      </div>
    </div>
  );
}

function ChipRow({ title, color, keys }: { title: string; color: string; keys: string[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {title}
      </div>
      <div className="flex flex-wrap gap-1">
        {keys.map((key) => (
          <span
            key={key}
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: `${color}14`, color }}
            title={RESOURCE_MAP[key]?.label ?? key}
          >
            {resourceEmoji(key)} {resourceLabel(key)}
          </span>
        ))}
      </div>
    </div>
  );
}
