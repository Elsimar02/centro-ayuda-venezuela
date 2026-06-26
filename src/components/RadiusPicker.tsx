"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER: [number, number] = [10.606, -66.915];

const pinIcon = L.divIcon({
  className: "ccc-pin",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export default function RadiusPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number; radius: number } | null;
  onChange: (v: { lat: number; lng: number; radius: number } | null) => void;
}) {
  const center = useMemo<[number, number]>(() => (value ? [value.lat, value.lng] : DEFAULT_CENTER), [value]);

  return (
    <div className="mt-2 flex flex-col gap-2.5">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ height: 180, borderColor: "var(--border)" }}
      >
        <MapContainer
          center={center}
          zoom={14}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" maxZoom={19} />
          <ClickCatcher onPick={(lat, lng) => onChange({ lat, lng, radius: value?.radius ?? 250 })} />
          {value && (
            <>
              <Marker position={[value.lat, value.lng]} icon={pinIcon} />
              <Circle
                center={[value.lat, value.lng]}
                radius={value.radius}
                pathOptions={{ color: "var(--accent)", fillColor: "var(--accent)", fillOpacity: 0.15 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {value ? (
        <>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={50}
              max={1500}
              step={50}
              value={value.radius}
              onChange={(e) => onChange({ ...value, radius: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="w-16 flex-shrink-0 text-right text-xs font-bold" style={{ color: "var(--fg-2)" }}>
              {value.radius} m
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="self-start text-xs font-bold"
            style={{ color: "var(--muted)" }}
          >
            Quitar zona del mapa
          </button>
        </>
      ) : (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Tocá el mapa para marcar la zona aproximada (opcional).
        </p>
      )}
    </div>
  );
}
