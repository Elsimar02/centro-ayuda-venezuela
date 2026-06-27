"use client";

import { useEffect, useState } from "react";

type Quake = {
  id: string;
  mag: number;
  place: string;
  time: number;
  depth: number;
  url: string;
};

const USGS_URL =
  "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-06-20&minlatitude=0&maxlatitude=14&minlongitude=-74&maxlongitude=-58&minmagnitude=2&orderby=time&limit=15";

function magColor(mag: number) {
  if (mag >= 6) return "#dc2626";
  if (mag >= 4.5) return "#e8950c";
  if (mag >= 3) return "#ca8a04";
  return "#16a34a";
}

function timeAgo(ts: number) {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export function SeismicActivity() {
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch(USGS_URL);
        if (!res.ok) throw new Error("bad status");
        const json = await res.json();
        if (ignore) return;
        const parsed: Quake[] = json.features.map((f: any) => ({
          id: f.id,
          mag: f.properties.mag,
          place: f.properties.place,
          time: f.properties.time,
          depth: f.geometry.coordinates[2],
          url: f.properties.url,
        }));
        setQuakes(parsed);
        setError(false);
      } catch {
        if (!ignore) setError(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="text-sm font-extrabold">🌎 Actividad sísmica reciente</div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>Fuente: USGS · se actualiza cada minuto</div>
      </div>

      {loading && (
        <div className="p-6 text-center text-sm" style={{ color: "var(--muted)" }}>Cargando sismos…</div>
      )}

      {!loading && error && (
        <div className="p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          No se pudo cargar la actividad sísmica en este momento.
        </div>
      )}

      {!loading && !error && quakes.length === 0 && (
        <div className="p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Sin sismos registrados en la región en los últimos días.
        </div>
      )}

      {!loading && !error && quakes.length > 0 && (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {quakes.map((q) => (
            <a
              key={q.id}
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 hover:opacity-80"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white"
                style={{ background: magColor(q.mag) }}
              >
                {q.mag.toFixed(1)}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-bold">{q.place}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {timeAgo(q.time)} · profundidad {q.depth.toFixed(0)} km
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
