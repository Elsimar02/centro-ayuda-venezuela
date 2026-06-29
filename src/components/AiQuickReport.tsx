"use client";

import { useState } from "react";
import { CATS, Draft, Report, STATUS } from "@/lib/types";
import { buildDraftFromParsed, parseText } from "@/lib/aiParse";
import { searchReportsByText } from "@/lib/matching";

export function AiQuickReport({
  reports,
  onReady,
  onSelectReport,
}: {
  reports: Report[];
  onReady: (draft: Partial<Draft>) => void;
  onSelectReport?: (report: Report) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Report[] | null>(null);

  async function handleSearch() {
    if (text.trim().length < 5) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseText(text);
      const found = searchReportsByText(
        { nombre: parsed.nombre ?? undefined, ubicacion: parsed.ubicacion ?? undefined, tipo: parsed.tipo },
        reports
      );
      setResults(found);
      if (found.length === 0) {
        const draft = await buildDraftFromParsed(parsed, text);
        setPendingDraft(draft);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el texto.");
    } finally {
      setLoading(false);
    }
  }

  const [pendingDraft, setPendingDraft] = useState<Partial<Draft> | null>(null);

  function reset() {
    setText("");
    setResults(null);
    setPendingDraft(null);
    setError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm font-extrabold"
        style={{ borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <span className="text-lg">✨</span>
        Busca con IA — pega un mensaje y te decimos qué sabemos
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border p-3.5" style={{ borderColor: "var(--accent)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold" style={{ color: "var(--accent)" }}>✨ Busca con IA</div>
        <button type="button" onClick={reset} aria-label="Cerrar" className="text-sm" style={{ color: "var(--muted)" }}>×</button>
      </div>

      {results === null && (
        <>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Pega un mensaje de WhatsApp, Twitter o cualquier red preguntando por alguien — buscamos primero si ya tenemos
            información (hospital, lista, encontrado, atrapado en algún edificio) antes de crear un reporte nuevo.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Ej. "Se busca al abuelo Carlos Gómez de 72 años, estaba en Los Palos Grandes en el edif colapsado, camisa azul a rayas tlf 04121112233"'
            className="h-20 w-full resize-none rounded-xl border p-2.5 text-sm outline-none"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || text.trim().length < 5}
            className="h-10 rounded-xl text-sm font-extrabold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "Buscando…" : "✨ Buscar"}
          </button>
          {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        </>
      )}

      {results !== null && results.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold" style={{ color: "var(--fg-2)" }}>
            Encontramos {results.length} registro{results.length > 1 ? "s" : ""} que podría{results.length > 1 ? "n" : ""} coincidir:
          </p>
          {results.map((r) => {
            const c = CATS[r.type];
            const st = STATUS[r.status];
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => onSelectReport?.(r)}
                className="flex items-center gap-3 rounded-xl border p-2.5 text-left"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <span className="text-lg">{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{r.details?.nombre || c.label}</div>
                  <div className="truncate text-xs" style={{ color: "var(--muted)" }}>{r.place}</div>
                </div>
                <span className="flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: `${st.color}1a`, color: st.color }}>
                  {st.label}
                </span>
              </button>
            );
          })}
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            ¿No es esto lo que buscabas?{" "}
            <button
              type="button"
              className="font-bold underline"
              style={{ color: "var(--accent)" }}
              onClick={async () => {
                setLoading(true);
                const parsed = await parseText(text);
                const draft = await buildDraftFromParsed(parsed, text);
                setLoading(false);
                onReady(draft);
                reset();
              }}
            >
              Crear un reporte nuevo
            </button>
          </p>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold" style={{ color: "var(--fg-2)" }}>
            No encontramos nada registrado sobre esto todavía.
          </p>
          <button
            type="button"
            onClick={() => {
              if (pendingDraft) onReady(pendingDraft);
              reset();
            }}
            className="h-10 rounded-xl text-sm font-extrabold text-white"
            style={{ background: "var(--accent)" }}
          >
            ✨ Crear reporte con esta información
          </button>
        </div>
      )}
    </div>
  );
}
