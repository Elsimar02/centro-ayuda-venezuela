export const runtime = "nodejs";

const VALID_TYPES = [
  "persona_desaparecida",
  "persona_encontrada_viva",
  "persona_fallecida",
  "atrapada",
  "colapso",
  "bloqueo",
  "peligro",
  "ayuda",
  "hospital",
  "hospital_insumos",
  "insumos_disponibles",
  "refugio",
  "agua",
  "alimentos",
  "electricidad",
  "internet",
  "mascota_perdida",
  "mascota_encontrada",
];

const SYSTEM_PROMPT = `Eres un asistente que extrae datos estructurados de mensajes caóticos de WhatsApp/redes sociales sobre la emergencia del terremoto en Venezuela (personas atrapadas, desaparecidas, mascotas perdidas, centros de ayuda, etc).

Devuelve SOLO un objeto JSON (sin texto alrededor) con estas claves:
{
  "tipo": uno de [${VALID_TYPES.join(", ")}] o null si no estás seguro,
  "nombre": nombre de la persona o mascota mencionada, o null,
  "edad": edad como string (ej. "72 años") o null,
  "ubicacion": dirección o lugar mencionado (edificio, sector, ciudad), o null,
  "telefono": número de teléfono/WhatsApp mencionado, o null,
  "descripcion_fisica": ropa, color, señas particulares, o null,
  "personas_afectadas": número de personas si se menciona, o null,
  "descripcion": un resumen breve y claro de la situación en español, máximo 2 frases,
  "urgencia": uno de [critica, alta, media, baja] según qué tan grave suene, o null
}

No inventes datos que no estén en el texto. Si un campo no aparece, usa null.`;

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GROQ_API_KEY no configurada" }, { status: 500 });
  }

  const { text } = await req.json().catch(() => ({ text: "" }));
  const trimmed = (text || "").trim();
  if (trimmed.length < 5) {
    return Response.json({ error: "El texto es muy corto." }, { status: 400 });
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return Response.json({ error: `Groq ${res.status}: ${body}` }, { status: 502 });
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return Response.json({ error: "La IA no devolvió un JSON válido." }, { status: 502 });
  }

  if (parsed.tipo && !VALID_TYPES.includes(parsed.tipo)) parsed.tipo = null;

  return Response.json(parsed);
}
