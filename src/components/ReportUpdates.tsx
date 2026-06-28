"use client";

import { useState } from "react";
import { useReportUpdates } from "@/hooks/useReportUpdates";
import { NewUpdate, ReportUpdate, UPDATE_KINDS, UpdateKind } from "@/lib/types";
import { telLink, waLink } from "@/lib/contact";
import { useLanguage } from "@/lib/i18n";

const ORDER: UpdateKind[] = ["confirmacion", "en_camino", "trabajando", "localizada", "resuelto", "info"];

export function ReportUpdates({ reportId }: { reportId: string }) {
  const { t, updateLabel, updateHint } = useLanguage();
  const { updates, loading, add } = useReportUpdates(reportId);
  const [kind, setKind] = useState<UpdateKind>("confirmacion");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const payload: NewUpdate = { kind, message, author_name: name, author_phone: phone };
    setSending(true);
    try {
      await add(payload);
      setMessage("");
      setPhone("");
      setKind("confirmacion");
    } catch {
      setError(t("updates.error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
      <div className="text-sm font-extrabold">
        {t("updates.title")}
        {updates.length > 0 && (
          <span className="ml-1.5 text-xs font-bold" style={{ color: "var(--muted)" }}>
            · {updates.length}
          </span>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-xs" style={{ color: "var(--muted)" }}>{t("updates.loading")}</div>
      ) : updates.length === 0 ? (
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          {t("updates.empty")}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {updates.map((u) => (
            <UpdateItem key={u.id} update={u} />
          ))}
        </div>
      )}

      {/* Formulario */}
      <div className="mt-1 flex flex-col gap-2.5 rounded-2xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className="text-xs font-bold" style={{ color: "var(--fg-2)" }}>{t("updates.formTitle")}</div>

        <div className="flex flex-wrap gap-1.5">
          {ORDER.map((k) => {
            const cfg = UPDATE_KINDS[k];
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                title={updateHint(k)}
                className="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                style={{
                  background: active ? cfg.color : "var(--surface)",
                  color: active ? "#fff" : "var(--fg)",
                  borderColor: active ? cfg.color : "var(--border)",
                }}
              >
                {cfg.emoji} {updateLabel(k)}
              </button>
            );
          })}
        </div>

        <p className="text-[11px]" style={{ color: "var(--muted)" }}>{updateHint(kind)}</p>

        <textarea
          value={message}
          aria-label={t("updates.messageAria")}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            kind === "localizada"
              ? t("updates.messagePlaceholder.localizada")
              : t("updates.messagePlaceholder.default")
          }
          className="h-20 w-full resize-none rounded-xl border p-2.5 text-sm outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        />

        <input
          value={name}
          aria-label={t("updates.nameAria")}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("updates.namePlaceholder")}
          className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        />
        <input
          value={phone}
          aria-label={t("updates.phoneAria")}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder={t("updates.phonePlaceholder")}
          className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        />
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
          {t("updates.phoneNote")}
        </p>

        {error && <p className="text-xs font-bold" style={{ color: "#dc2626" }}>{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="h-11 rounded-xl text-sm font-extrabold text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {sending ? t("updates.submitting") : t("updates.submit")}
        </button>
      </div>
    </div>
  );
}

function UpdateItem({ update }: { update: ReportUpdate }) {
  const { t, updateLabel, timeAgo } = useLanguage();
  const cfg = UPDATE_KINDS[update.kind];
  const wa = update.author_phone ? waLink(update.author_phone) : null;
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold"
          style={{ background: `${cfg.color}22`, color: cfg.color }}
        >
          {cfg.emoji} {updateLabel(update.kind)}
        </span>
        <span className="text-[11px]" style={{ color: "var(--muted)" }}>{timeAgo(update.created_at)}</span>
      </div>

      {update.message && (
        <p className="mt-1.5 text-sm" style={{ color: "var(--fg-2)" }}>{update.message}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold">{update.author_name}</span>
        {update.author_phone && (
          <>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold text-white"
                style={{ background: "#16a34a" }}
              >
                {t("contact.whatsapp")}
              </a>
            )}
            <a
              href={telLink(update.author_phone)}
              className="inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}
            >
              {t("contact.call")}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
