"use client";

import { memo, useMemo } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { NeedReport } from "@/lib/needs";
import { URG, Urgency } from "@/lib/types";

const iconCache = new Map<Urgency, L.DivIcon>();

function icon(urgency: Urgency) {
  const cached = iconCache.get(urgency);
  if (cached) return cached;
  const color = URG[urgency].color;
  const ring =
    urgency === "critica"
      ? `<div style="position:absolute;left:50%;top:13px;width:30px;height:30px;margin-left:-15px;border-radius:50%;background:${color};animation:ccpulse 1.8s ease-out infinite"></div>`
      : "";
  const html = `<div style="position:relative;width:34px;height:46px">${ring}<div style="position:absolute;left:2px;top:0;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg) translateZ(0);background:${color};border:2px solid #fff;box-shadow:0 2px 3px rgba(0,0,0,.35)"></div><div style="position:absolute;left:2px;top:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px">🆘</div></div>`;
  const divIcon = L.divIcon({ className: "ccc-pin", html, iconSize: [34, 46], iconAnchor: [17, 40] });
  iconCache.set(urgency, divIcon);
  return divIcon;
}

const NeedMarker = memo(function NeedMarker({ need, onSelect }: { need: NeedReport; onSelect: (n: NeedReport) => void }) {
  if (need.lat == null || need.lng == null) return null;
  return (
    <Marker
      position={[need.lat, need.lng]}
      icon={icon(need.urgency)}
      eventHandlers={{ click: () => onSelect(need) }}
    />
  );
});

export default function NeedsMap({
  needs,
  theme,
  onSelect,
}: {
  needs: NeedReport[];
  theme: "light" | "dark";
  onSelect: (need: NeedReport) => void;
}) {
  const url =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const markers = useMemo(
    () => needs.filter((n) => n.lat != null && n.lng != null).map((n) => <NeedMarker key={n.id} need={n} onSelect={onSelect} />),
    [needs, onSelect]
  );

  return (
    <MapContainer center={[8, -66]} zoom={6} zoomControl={false} attributionControl={false} scrollWheelZoom style={{ height: "100%", width: "100%", background: "var(--surface-2)" }}>
      <TileLayer url={url} maxZoom={19} />
      <ZoomControl position="bottomleft" />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={55} disableClusteringAtZoom={18} spiderfyOnMaxZoom removeOutsideVisibleBounds animate={false}>
        {markers}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
