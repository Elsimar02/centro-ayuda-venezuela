"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { label: string; lat: number; lng: number };

type PhotonProperties = {
  name?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
};

type PhotonFeature = {
  properties: PhotonProperties;
  geometry: { coordinates: [number, number] };
};

// Sesgamos la búsqueda hacia La Guaira (no la limitamos solo a ahí, Photon
// usa esto como preferencia de cercanía, no como caja estricta).
const BIAS_LAT = 10.606;
const BIAS_LON = -66.915;

function labelFor(p: PhotonProperties): string {
  const place = p.city || p.town || p.village || p.county;
  const parts = [p.name, p.street, place, p.state].filter(Boolean);
  return [...new Set(parts)].join(", ");
}

export function AddressAutocomplete({
  value,
  onChange,
  onPick,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (s: Suggestion) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = value.trim();

    debounceRef.current = setTimeout(async () => {
      const myReq = ++reqRef.current;
      if (query.length < 3) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const url =
          `https://photon.komoot.io/api/?limit=6&lat=${BIAS_LAT}&lon=${BIAS_LON}` +
          `&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (myReq !== reqRef.current) return;
        const data: { features?: PhotonFeature[] } = await res.json();
        if (myReq !== reqRef.current) return;
        const rows = (data.features || []).map((f) => ({
          label: labelFor(f.properties),
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }));
        setSuggestions(rows.filter((r) => r.label));
      } catch {
        if (myReq === reqRef.current) setSuggestions([]);
      } finally {
        if (myReq === reqRef.current) setLoading(false);
      }
    }, query.length < 3 ? 0 : 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        value={value}
        aria-label="Buscar dirección"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border px-3.5 text-sm outline-none"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
      />
      {open && (loading || suggestions.length > 0) && (
        <div
          className="absolute left-0 right-0 z-10 mt-1.5 max-h-56 overflow-y-auto rounded-xl border shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {loading && (
            <div className="px-3.5 py-2.5 text-xs" style={{ color: "var(--muted)" }}>
              Buscando…
            </div>
          )}
          {!loading &&
            suggestions.map((s, i) => (
              <button
                key={`${s.lat},${s.lng},${s.label}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s.label);
                  onPick(s);
                  setOpen(false);
                }}
                className="block w-full px-3.5 py-2.5 text-left text-xs"
                style={{ borderTop: i > 0 ? "1px solid var(--border-2)" : undefined }}
              >
                📍 {s.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
