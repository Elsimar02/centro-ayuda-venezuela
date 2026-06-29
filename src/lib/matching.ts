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
    // NFD separa los acentos como caracteres combinantes (ej. "López" → l,o,◌́,p,e,z).
    // Hay que BORRARLOS, no reemplazarlos por espacio — si no, "López" se
    // parte en "lo" + "pez" en vez de quedar como "lopez".
    .replace(/[\u0300-\u036f]/g, "")
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

// Búsqueda libre por nombre (y opcionalmente ubicación) contra TODO lo que ya
// tenemos registrado — para cuando alguien pega un mensaje preguntando "¿se
// sabe algo de fulano?" y lo primero que debe pasar es buscar, no crear un
// reporte nuevo de una.
const PERSON_SEARCH_TYPES: ReportType[] = [
  "persona_desaparecida",
  "persona_encontrada_viva",
  "persona_fallecida",
  "persona_lista_hospital",
];
const PET_SEARCH_TYPES: ReportType[] = ["mascota_perdida", "mascota_encontrada"];
const LOCATION_SEARCH_TYPES: ReportType[] = ["atrapada", "colapso", "bloqueo", "peligro"];

function placeTokens(r: Report): Set<string> {
  return nameTokens([r.place, r.details?.acceso, r.details?.ubicacion_aprox].filter(Boolean).join(" "));
}

// Todo el texto libre de un reporte: descripción, lugar, nombre de quien
// reportó y cualquier valor de "details" (acceso, edad, hospital, etc). Un
// nombre de víctima casi siempre vive solo en la descripción de un reporte de
// "atrapada"/"colapso" — nunca en un campo estructurado — así que para
// encontrarla hay que mirar TODO el texto, no solo `details.nombre`.
function fullTextTokens(r: Report): Set<string> {
  const detailValues = r.details ? Object.values(r.details) : [];
  return nameTokens([r.description, r.place, r.reporter_name, ...detailValues].filter(Boolean).join(" "));
}

type SearchCategory = "persona" | "mascota" | "lugar" | null;

function categoryOf(tipo: ReportType | null | undefined): SearchCategory {
  if (!tipo) return null;
  if (PERSON_SEARCH_TYPES.includes(tipo)) return "persona";
  if (PET_SEARCH_TYPES.includes(tipo)) return "mascota";
  if (LOCATION_SEARCH_TYPES.includes(tipo)) return "lugar";
  return null;
}

// `tipo` viene de lo que la IA detectó en el mensaje (persona, mascota, edificio
// atrapado, etc). Es clave para no cruzar categorías: si preguntan por un gato,
// jamás debe devolver hospitales o personas, y viceversa.
export function searchReportsByText(
  query: { nombre?: string; ubicacion?: string; tipo?: ReportType | null },
  all: Report[]
): Report[] {
  const nameQ = nameTokens(query.nombre);
  const locQ = nameTokens(query.ubicacion);
  const category = categoryOf(query.tipo);
  // `null` (la IA no pudo clasificar) significa "revisa todas las categorías",
  // no "no busques nada". Una categoría explícita SÍ restringe — si dice
  // mascota, jamás debe mezclar personas/lugares, y viceversa.
  const allow = (c: Exclude<SearchCategory, null>) => category === null || category === c;
  const scored: { report: Report; score: number }[] = [];

  for (const r of all) {
    let score = 0;

    // Preferimos mostrar de más a que alguien se quede sin ver un reporte real
    // de un familiar: basta con que comparta AL MENOS una palabra del nombre
    // (ej. solo "Alexander", o solo "López") para aparecer en la lista. La
    // persona que busca ve apellido/lugar/foto de cada resultado y descarta
    // ella misma los que no son quien busca.
    if (nameQ.size > 0 && allow("persona") && PERSON_SEARCH_TYPES.includes(r.type)) {
      const haystack = nameTokens(nameOf(r));
      let overlap = 0;
      for (const t of nameQ) if (haystack.has(t)) overlap++;
      const union = nameQ.size + haystack.size - overlap;
      const jaccard = union > 0 ? overlap / union : 0;
      if (overlap >= 1) score += 2 + jaccard;
    }

    // El nombre de alguien atrapado/bajo escombros casi siempre vive solo en
    // la descripción de un reporte de "atrapada"/"colapso"/"bloqueo"/"peligro",
    // nunca en un campo de nombre estructurado — hay que rastrear ahí también.
    if (nameQ.size > 0 && allow("persona") && LOCATION_SEARCH_TYPES.includes(r.type)) {
      const haystack = fullTextTokens(r);
      let overlap = 0;
      for (const t of nameQ) if (haystack.has(t)) overlap++;
      if (overlap >= 1) score += 1.5 + overlap * 0.1;
    }

    if (nameQ.size > 0 && allow("mascota") && PET_SEARCH_TYPES.includes(r.type)) {
      // Nombres de mascota son una sola palabra distintiva enterrada en una
      // descripción larga ("Se llama Luna y se perdió…"): basta con que
      // aparezca, no tiene sentido pedir similitud Jaccard contra todo el texto.
      const haystack = nameTokens([r.description, r.details?.descripcion, r.reporter_name].filter(Boolean).join(" "));
      let overlap = 0;
      for (const t of nameQ) if (haystack.has(t)) overlap++;
      if (overlap >= 1) score += 2 + overlap * 0.1;
    }

    if (locQ.size > 0 && allow("lugar") && LOCATION_SEARCH_TYPES.includes(r.type)) {
      const haystack = placeTokens(r);
      let overlap = 0;
      for (const t of locQ) if (haystack.has(t)) overlap++;
      if (overlap >= 1) score += overlap * 0.5;
    }

    if (score > 0) scored.push({ report: r, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((s) => s.report);
}
