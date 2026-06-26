"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

function icon(report: Report) {
  const c = CATS[report.type];
  const ring =
    report.urgency === "critica"
      ? `<div style="position:absolute;left:50%;top:13px;width:30px;height:30px;margin-left:-15px;border-radius:50%;background:${c.color};animation:ccpulse 1.8s ease-out infinite"></div>`
      : "";
  const html = `<div style="position:relative;width:34px;height:46px">${ring}<div style="position:absolute;left:2px;top:0;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${c.color};border:2px solid #fff;box-shadow:0 3px 7px rgba(0,0,0,.4)"></div><div style="position:absolute;left:2px;top:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">${c.emoji}</div></div>`;
  return L.divIcon({ className: "ccc-pin", html, iconSize: [34, 46], iconAnchor: [17, 40] });
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 0.6 });
  }, [target, map]);
  return null;
}

export default function ReportMap({
  reports,
  theme,
  base,
  center,
  flyTarget,
  onSelect,
}: {
  reports: Report[];
  theme: "light" | "dark";
  base: "streets" | "sat";
  center: [number, number];
  flyTarget: [number, number] | null;
  onSelect: (report: Report) => void;
}) {
  const url = useMemo(() => tileUrl(theme, base), [theme, base]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%", background: "var(--surface-2)" }}
    >
      <TileLayer url={url} maxZoom={19} />
      <FlyTo target={flyTarget} />
      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={icon(r)}
          eventHandlers={{ click: () => onSelect(r) }}
        />
      ))}
    </MapContainer>
  );
}
