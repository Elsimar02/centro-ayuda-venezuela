import { EMERGENCY_TYPES, NEEDS_LIST } from "@/lib/needs";

export const runtime = "nodejs";

const EMERGENCY_KEYS = EMERGENCY_TYPES.map((e) => e.key);
const NEED_KEYS = NEEDS_LIST.map((n) => n.key);

const SYSTEM_PROMPT = `Eres un asistente que extrae datos estructurados de mensajes caóticos de WhatsApp/redes sobre necesidades humanitarias tras el terremoto en Venezuela.

Devuelve SOLO un objeto JSON (sin texto alrededor) con estas claves:
{
  "contact_name": nombre de quien reporta o de la familia, o null,
  "contact_phone": teléfono/WhatsApp mencionado, o null,
  "estado": estado de Venezuela mencionado, o null,
  "direccion": dirección, sector o referencia de ubicación mencionada, o null,
  "people_total": número total de personas afectadas (entero) o null,
  "people_children": número de niños o null,
  "people_elderly": número de adultos mayores o null,
  "emergency_types": array con cero o más de [${EMERGENCY_KEYS.join(", ")}] según lo que describa el mensaje,
  "needs": array con cero o más de [${NEED_KEYS.join(", ")}] según lo que se necesite,
  "urgency": uno de [critica, alta, media, baja] según qué tan grave suene (atrapados/heridos/sin agua = critica o alta),
  "description": un resumen breve y claro de la situación en español, máximo 3 frases
}

No inventes datos que no estén en el texto. Si un campo no aparece, usa null (o array vacío para emergency_types/needs).`;

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

  parsed.emergency_types = Array.isArray(parsed.emergency_types)
    ? parsed.emergency_types.filter((k: string) => EMERGENCY_KEYS.includes(k))
    : [];
  parsed.needs = Array.isArray(parsed.needs) ? parsed.needs.filter((k: string) => NEED_KEYS.includes(k)) : [];
  if (!["critica", "alta", "media", "baja"].includes(parsed.urgency)) parsed.urgency = null;

  return Response.json(parsed);
}
