import { createClient } from "@supabase/supabase-js";
import { findPossibleMatches } from "@/lib/matching";
import { CATS, Report } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://centrocooperativovenezuela.com";

type Subscription = {
  id: string;
  report_id: string;
  email: string;
  notified_match_ids: string[];
};

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ALERTS_FROM_EMAIL || "Centro de Coordinación <onboarding@resend.dev>";
  if (!key) throw new Error("RESEND_API_KEY no configurada");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function emailHtml(followedName: string, matches: Report[]): string {
  const items = matches
    .map((m) => {
      const c = CATS[m.type];
      return `<li><b>${m.details?.nombre || c.label}</b> — ${c.label} · ${m.place}</li>`;
    })
    .join("");
  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0a0b0f">
      <h2>Posible coincidencia para ${followedName || "la persona que sigues"}</h2>
      <p>Apareció ${matches.length === 1 ? "un registro" : `${matches.length} registros`} que podría${
        matches.length === 1 ? "" : "n"
      } coincidir con la persona que sigues en el Centro de Coordinación:</p>
      <ul>${items}</ul>
      <p style="color:#b45309"><b>Importante:</b> esta información no está confirmada. Por favor verifícala con cuidado antes de dar nada por seguro.</p>
      <p><a href="${APP_URL}" style="color:#0a7">Abrir el Centro de Coordinación</a></p>
    </div>`;
}

export async function GET(req: Request) {
  // Seguridad: solo Vercel Cron (o quien tenga el secreto) puede dispararla.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ error: "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }
  const supabase = createClient(url, serviceKey);

  // Cargar todos los reportes (paginado por el tope de 1000 de PostgREST).
  const all: Report[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("reports").select("*").range(from, from + 999);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    all.push(...((data as Report[]) ?? []));
    if (!data || data.length < 1000) break;
  }
  const byId = new Map(all.map((r) => [r.id, r]));

  const { data: subs, error: subErr } = await supabase.from("alert_subscriptions").select("*");
  if (subErr) return Response.json({ error: subErr.message }, { status: 500 });

  let sent = 0;
  for (const sub of (subs as Subscription[]) ?? []) {
    const followed = byId.get(sub.report_id);
    if (!followed) continue;
    const matches = findPossibleMatches(followed, all).map((m) => m.report);
    const already = new Set(sub.notified_match_ids ?? []);
    const fresh = matches.filter((m) => !already.has(m.id));
    if (fresh.length === 0) continue;

    try {
      await sendEmail(
        sub.email,
        `Posible coincidencia para ${followed.details?.nombre || "tu seguimiento"}`,
        emailHtml(followed.details?.nombre || "", fresh)
      );
      await supabase
        .from("alert_subscriptions")
        .update({ notified_match_ids: [...already, ...fresh.map((m) => m.id)] })
        .eq("id", sub.id);
      sent++;
    } catch (e) {
      console.error("Error enviando alerta a", sub.email, e);
    }
  }

  return Response.json({ ok: true, subscriptions: (subs ?? []).length, emailsSent: sent });
}
