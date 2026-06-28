import { Report, ReportType } from "@/lib/types";

// Cruce automático entre quien BUSCA a alguien (persona_desaparecida) y los
// registros donde esa persona podría APARECER (listas de hospital, encontrada
// con vida, fallecida). El objetivo es ayudar a reunir familias, sin afirmar
// nada: siempre es "posible coincidencia, sin confirmar".

const SEARCHING: ReportType[] = ["persona_desaparecida"];
const FOUND: ReportType[] = ["persona_lista_hospital", "persona_encontrada_viva", "persona_fallecida"];

const STOPWORDS = new Set(["de", "la", "del", "los", "las", "y", "el", "san", "santa"]);

function nameTokens(s: string | undefined): Set<string> {
  const norm = (s || "")
    .toLowerCase()
    .normalize("NFD")
    // NFD separa los acentos como combinantes; [^a-z\s] de abajo los elimina.
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return new Set(norm);
}

function last4(cedula: string | undefined): string | null {
  const d = (cedula || "").replace(/\D/g, "");
  return d.length >= 4 ? d.slice(-4) : null;
}

function cedulaLast4(details: Record<string, string> | undefined): string | null {
  if (!details) return null;
  // Desaparecidos/encontrados guardan cédula completa; hospital/fallecida solo
  // los últimos 4 dígitos por privacidad.
  return last4(details.cedula) ?? (details.cedula_ultimos4 ? last4(details.cedula_ultimos4) : null);
}

function nameOf(r: Report): string | undefined {
  return r.details?.nombre;
}

export type MatchConfidence = "alta" | "media";
export type Match = { report: Report; confidence: MatchConfidence; reasons: string[] };

export function findPossibleMatches(report: Report, all: Report[]): Match[] {
  const isSearching = SEARCHING.includes(report.type);
  const isFound = FOUND.includes(report.type);
  if (!isSearching && !isFound) return [];

  const targetTypes = isSearching ? FOUND : SEARCHING;
  const myTokens = nameTokens(nameOf(report));
  const myCedula = cedulaLast4(report.details);
  if (myTokens.size === 0 && !myCedula) return [];

  const matches: Match[] = [];
  for (const cand of all) {
    if (cand.id === report.id) continue;
    if (!targetTypes.includes(cand.type)) continue;

    const candTokens = nameTokens(nameOf(cand));
    let overlap = 0;
    for (const t of myTokens) if (candTokens.has(t)) overlap++;
    // Similitud Jaccard: cuánto se parecen los nombres COMO CONJUNTO, no solo
    // cuántas palabras comparten. En Venezuela apellidos como González/Pérez/
    // Hernández son comunísimos, así que "comparten 2 palabras" da falsos
    // positivos. Exigir Jaccard alto = los nombres son casi el mismo.
    const union = myTokens.size + candTokens.size - overlap;
    const jaccard = union > 0 ? overlap / union : 0;

    const candCedula = cedulaLast4(cand.details);
    const cedulaMatch = !!myCedula && !!candCedula && myCedula === candCedula;

    const reasons: string[] = [];
    let confidence: MatchConfidence | null = null;

    if (cedulaMatch && overlap >= 1) {
      confidence = "alta";
      reasons.push("coinciden los últimos 4 dígitos de la cédula y el nombre");
    } else if (overlap >= 2 && jaccard >= 0.6) {
      confidence = "media";
      reasons.push("el nombre completo es casi idéntico");
    }
    // Nombre que solo comparte apellidos comunes, o cédula sola, se descarta:
    // un falso positivo aquí es peligroso (falsa esperanza o angustia).

    if (confidence) matches.push({ report: cand, confidence, reasons });
  }

  const rank = { alta: 0, media: 1 };
  return matches.sort((a, b) => rank[a.confidence] - rank[b.confidence]).slice(0, 8);
}
