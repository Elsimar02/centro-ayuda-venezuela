"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { CATS, Report } from "@/lib/types";

function tileUrl(theme: "light" | "dark", base: "streets" | "sat") {
  if (base === "sat") {
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }
  return theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
}

// Solo hay pocas combinaciones tipo+urgencia: cachear el divIcon evita
// reconstruir HTML/ícono de cada marcador en cada re-render (ej. al hacer hover).
const iconCache = new Map<string, L.DivIcon>();

function icon(type: Report["type"], urgency: Report["urgency"]) {
  const key = `${type}|${urgency}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const c = CATS[type];
  const ring =
    urgency === "critica"
      ? `<div style="position:absolute;left:50%;top:13px;width:30px;height:30px;margin-left:-15px;border-radius:50%;background:${c.color};animation:ccpulse 1.8s ease-out infinite"></div>`
      : "";
  const html = `<div style="position:relative;width:34px;height:46px">${ring}<div style="position:absolute;left:2px;top:0;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg) translateZ(0);background:${c.color};border:2px solid #fff;box-shadow:0 2px 3px rgba(0,0,0,.35)"></div><div style="position:absolute;left:2px;top:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">${c.emoji}</div></div>`;
  const divIcon = L.divIcon({ className: "ccc-pin", html, iconSize: [34, 46], iconAnchor: [17, 40] });
  iconCache.set(key, divIcon);
  return divIcon;
}

const ReportMarker = memo(function ReportMarker({
  report,
  onHover,
  onUnhover,
  onSelect,
}: {
  report: Report;
  onHover: (id: string) => void;
  onUnhover: (id: string) => void;
  onSelect: (report: Report) => void;
}) {
  const r = report;
  const c = CATS[r.type];
  const radius = Number(r.details?._approx_radius_m);
  return (
    <Marker
      position={[r.lat, r.lng]}
      icon={icon(r.type, r.urgency)}
      eventHandlers={{
        click: () => {
          onHover(r.id);
          onSelect(r);
        },
        mouseover: () => onHover(r.id),
        mouseout: () => onUnhover(r.id),
      }}
    >
      <Tooltip className="ccc-tooltip" direction="top" offset={[0, -38]} sticky>
        {c.emoji} {c.label}
        {radius > 0 ? ` · zona aprox. ${radius} m` : ""}
      </Tooltip>
    </Marker>
  );
});

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 0.6 });
  }, [target, map]);
  return null;
}

function LocateButton() {
  const map = useMap();
  return (
    <button
      type="button"
      title="Ir a mi ubicación"
      aria-label="Ir a mi ubicación"
      onClick={() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 0.6 });
        });
      }}
      className="absolute bottom-[92px] left-2.5 z-[400] flex h-10 w-10 items-center justify-center rounded-full border text-base shadow-md"
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
    >
      🎯
    </button>
  );
}

export default function ReportMap({
  reports,
  theme,
  base,
  center,
  zoom = 6,
  flyTarget,
  onSelect,
}: {
  reports: Report[];
  theme: "light" | "dark";
  base: "streets" | "sat";
  center: [number, number];
  zoom?: number;
  flyTarget: [number, number] | null;
  onSelect: (report: Report) => void;
}) {
  const url = useMemo(() => tileUrl(theme, base), [theme, base]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const handleHover = useCallback((id: string) => setHoveredId(id), []);
  const handleUnhover = useCallback(
    (id: string) => setHoveredId((cur) => (cur === id ? null : cur)),
    []
  );

  // onSelect puede llegar como arrow inline desde el padre (identidad inestable),
  // lo que rompería el memo de los marcadores. Lo guardamos en un ref y exponemos
  // un callback estable, para que la lista de marcadores no se reconstruya.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const handleSelect = useCallback((report: Report) => onSelectRef.current(report), []);

  // Memoizamos los marcadores con dependencia solo en `reports`: así un hover/clic
  // (que cambia hoveredId y re-renderiza este componente) NO recrea ni reconcilia
  // los ~1865 marcadores; solo se vuelve a dibujar el Circle del radio aproximado.
  const markers = useMemo(
    () =>
      reports.map((r) => (
        <ReportMarker
          key={r.id}
          report={r}
          onHover={handleHover}
          onUnhover={handleUnhover}
          onSelect={handleSelect}
        />
      )),
    [reports, handleHover, handleUnhover, handleSelect]
  );
  const hoveredReport = useMemo(
    () => (hoveredId ? reports.find((r) => r.id === hoveredId) ?? null : null),
    [hoveredId, reports]
  );
  const hoveredRadius = hoveredReport ? Number(hoveredReport.details?._approx_radius_m) : 0;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "var(--surface-2)" }}
    >
      <TileLayer url={url} maxZoom={19} />
      <ZoomControl position="bottomleft" />
      <LocateButton />
      <FlyTo target={flyTarget} />
      {hoveredReport && hoveredRadius > 0 && (
        <Circle
          center={[hoveredReport.lat, hoveredReport.lng]}
          radius={hoveredRadius}
          pathOptions={{
            color: CATS[hoveredReport.type].color,
            fillColor: CATS[hoveredReport.type].color,
            fillOpacity: 0.12,
            weight: 1.5,
          }}
        />
      )}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={55}
        disableClusteringAtZoom={18}
        spiderfyOnMaxZoom
        removeOutsideVisibleBounds
        animate={false}
      >
        {markers}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
