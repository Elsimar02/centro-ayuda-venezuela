"use client";

import { memo, useMemo } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { waLink, telLink } from "@/lib/contact";
import {
  AidProvider,
  KIND_CONFIG,
  NeedEntry,
  needResourceEmoji,
  needResourceLabel,
  resourceEmoji,
  resourceLabel,
} from "@/lib/marketplace";

function tileUrl(theme: "light" | "dark") {
  return theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
}

// Una capa "ofrece" (verde) y otra "necesita" (rojo): mismo proveedor puede
// aparecer en ambas si declaró las dos cosas.
const iconCache = new Map<string, L.DivIcon>();
function layerIcon(kind: "offer" | "need", emoji: string) {
  const key = `${kind}|${emoji}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const color = kind === "offer" ? "#16a34a" : "#dc2626";
  const html = `<div style="position:relative;width:30px;height:40px"><div style="position:absolute;left:1px;top:0;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 2px 3px rgba(0,0,0,.35)"></div><div style="position:absolute;left:1px;top:0;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px">${emoji}</div></div>`;
  const icon = L.divIcon({ className: "ccc-pin", html, iconSize: [30, 40], iconAnchor: [15, 36] });
  iconCache.set(key, icon);
  return icon;
}

const ProviderMarker = memo(function ProviderMarker({
  provider: p,
  layer,
}: {
  provider: AidProvider;
  layer: "offer" | "need";
}) {
  const k = KIND_CONFIG[p.kind];
  const keys = layer === "offer" ? p.offers : p.needs;
  const wa = p.whatsapp ? waLink(p.whatsapp) : null;
  return (
    <Marker position={[p.lat, p.lng]} icon={layerIcon(layer, k.emoji)}>
      <Popup>
        <div className="flex flex-col gap-1.5" style={{ minWidth: 180 }}>
          <div className="text-sm font-extrabold">{k.emoji} {p.name}</div>
          <div className="text-xs" style={{ color: "#6b7280" }}>{k.label}{p.place ? ` · ${p.place}` : ""}</div>
          <div className="flex flex-wrap gap-1 pt-1">
            {keys.map((key) => (
              <span key={key} className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: layer === "offer" ? "#16a34a1f" : "#dc26261f", color: layer === "offer" ? "#16a34a" : "#dc2626" }}>
                {resourceEmoji(key)} {resourceLabel(key)}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1.5">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-md px-2 py-1 text-[11px] font-bold text-white" style={{ background: "#16a34a" }}>
                💬 WhatsApp
              </a>
            )}
            {p.phone && (
              <a href={telLink(p.phone)} className="rounded-md border px-2 py-1 text-[11px] font-bold">
                ☎️ Llamar
              </a>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

// Necesidades que vienen del módulo "Necesidades Humanitarias" (tabla
// `necesidades`), mostradas con el mismo pin rojo que un colaborador que
// "necesita", pero usando su propio catálogo de etiquetas (NEEDS_LIST).
const NeedMarker = memo(function NeedMarker({ entry: n }: { entry: NeedEntry }) {
  if (n.lat == null || n.lng == null) return null;
  const wa = n.whatsapp ? waLink(n.whatsapp) : null;
  return (
    <Marker position={[n.lat, n.lng]} icon={layerIcon("need", "🆘")}>
      <Popup>
        <div className="flex flex-col gap-1.5" style={{ minWidth: 180 }}>
          <div className="text-sm font-extrabold">🆘 {n.name}</div>
          <div className="text-xs" style={{ color: "#6b7280" }}>Necesidad humanitaria{n.place ? ` · ${n.place}` : ""}</div>
          <div className="flex flex-wrap gap-1 pt-1">
            {n.needs.map((key) => (
              <span key={key} className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: "#dc26261f", color: "#dc2626" }}>
                {needResourceEmoji(key)} {needResourceLabel(key)}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1.5">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-md px-2 py-1 text-[11px] font-bold text-white" style={{ background: "#16a34a" }}>
                💬 WhatsApp
              </a>
            )}
            {n.phone && (
              <a href={telLink(n.phone)} className="rounded-md border px-2 py-1 text-[11px] font-bold">
                ☎️ Llamar
              </a>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

export default function MarketplaceMap({
  providers,
  needEntries = [],
  theme,
  center,
  zoom = 7,
  showOffers,
  showNeeds,
  userLoc,
}: {
  providers: AidProvider[];
  needEntries?: NeedEntry[];
  theme: "light" | "dark";
  center: [number, number];
  zoom?: number;
  showOffers: boolean;
  showNeeds: boolean;
  userLoc: { lat: number; lng: number } | null;
}) {
  const url = useMemo(() => tileUrl(theme), [theme]);
  const offerMarkers = useMemo(
    () =>
      showOffers
        ? providers.filter((p) => p.offers.length > 0).map((p) => <ProviderMarker key={`o-${p.id}`} provider={p} layer="offer" />)
        : [],
    [providers, showOffers]
  );
  const needMarkers = useMemo(
    () =>
      showNeeds
        ? [
            ...providers.filter((p) => p.needs.length > 0).map((p) => <ProviderMarker key={`n-${p.id}`} provider={p} layer="need" />),
            ...needEntries.filter((n) => n.lat != null && n.lng != null).map((n) => <NeedMarker key={`nh-${n.id}`} entry={n} />),
          ]
        : [],
    [providers, needEntries, showNeeds]
  );

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
      {userLoc && (
        <Circle
          center={[userLoc.lat, userLoc.lng]}
          radius={400}
          pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.25, weight: 2 }}
        />
      )}
      <MarkerClusterGroup chunkedLoading maxClusterRadius={50} disableClusteringAtZoom={18} spiderfyOnMaxZoom removeOutsideVisibleBounds animate={false}>
        {offerMarkers}
        {needMarkers}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
