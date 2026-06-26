"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { label: string; lat: number; lng: number };

// Viewbox alrededor de La Guaira/Vargas para priorizar resultados cercanos,
// countrycodes=ve para no recibir calles de España u otros países.
const VIEWBOX = "-67.4,10.75,-66.4,10.45";

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
          "https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6" +
          `&countrycodes=ve&viewbox=${VIEWBOX}&bounded=0` +
          `&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { "Accept-Language": "es" } });
        const rows: { display_name: string; lat: string; lon: string }[] = await res.json();
        if (myReq !== reqRef.current) return;
        setSuggestions(rows.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })));
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
