"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CATS, PEOPLE_COUNT_TYPES, RESOLVE_THRESHOLD, Report, SHOW_URGENCY_TYPES, STATUS, TYPE_FIELDS, URG } from "@/lib/types";
import { telLink, waLink } from "@/lib/contact";
import { ReportUpdates } from "@/components/ReportUpdates";
import { useLanguage } from "@/lib/i18n";

export function ReportDetailPanel({
  report,
  onClose,
  onVerify,
  onFalse,
  onAttended,
  onResolved,
  onViewMap,
  moderator = false,
}: {
  report: Report;
  onClose: () => void;
  onVerify?: () => void;
  onFalse?: () => void;
  onAttended?: () => void;
  onResolved?: () => void;
  onViewMap?: () => void;
  moderator?: boolean;
}) {
  const { t, tSplit, catLabel, statusLabel, urgLabel, fieldLabel, timeAgo } = useLanguage();
  const cat = CATS[report.type];
  const st = STATUS[report.status];
  const fields = TYPE_FIELDS[report.type] || [];
  const showPeople = PEOPLE_COUNT_TYPES.has(report.type);
  const showUrgency = SHOW_URGENCY_TYPES.has(report.type);
  const radius = Number(report.details?._approx_radius_m);
  const reporterWa = report.contact_phone ? waLink(report.contact_phone) : null;
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Ejecuta la acción y muestra una confirmación visible (el cambio en los
  // contadores es sutil, así que sin feedback parece que el botón no hace nada).
  function act(fn: (() => void) | undefined, msg: string) {
    return () => {
      if (!fn) return;
      fn();
      setFeedback(msg);
      window.setTimeout(() => setFeedback(null), 3000);
    };
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (lightbox) setLightbox(null);
      else onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox, onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal>
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: "rgba(0,0,0,.35)", animation: "ccfadein .2s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto"
        style={{ background: "var(--surface)", color: "var(--fg)", animation: "ccslidein .28s cubic-bezier(.16,1,.3,1)" }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
              style={{ background: `${cat.color}24` }}
            >
              {cat.emoji}
            </span>
            <div>
              <div className="text-lg font-extrabold leading-tight">{catLabel(report.type)}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(report.created_at)}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-xl" aria-label={t("common.close")}>×</button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={st.color}>{statusLabel(report.status)}</Badge>
            {showUrgency && <Badge color={URG[report.urgency].color}>{t("detail.urgency", { label: urgLabel(report.urgency) })}</Badge>}
            {showPeople && <Badge color="var(--muted)">{t("detail.peopleAffected", { n: report.people })}</Badge>}
          </div>

          <Section title={t("detail.description")}>
            <p className="text-base font-semibold leading-snug" style={{ color: "var(--fg)" }}>
              {report.description || t("detail.noDescription")}
            </p>
          </Section>

          {fields.length > 0 && (
            <Section title={t("detail.details")}>
              <div className="flex flex-col gap-2.5">
                {fields.map((f) => {
                  const value = report.details?.[f.key];
                  if (!value) return null;
                  return (
                    <div key={f.key}>
                      <div className="text-xs font-bold" style={{ color: "var(--muted)" }}>{fieldLabel(report.type, f.key)}</div>
                      <div className="text-base font-semibold" style={{ color: "var(--fg)" }}>{value}</div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          <Section title={t("detail.location")}>
            <p className="text-base font-bold leading-snug" style={{ color: "var(--fg)" }}>
              📍 {report.place}
              {radius > 0 ? ` ${t("detail.zoneApprox", { n: radius })}` : ""}
            </p>
            {report.details?.ubicacion_aprox && (
              <p className="mt-1 text-xs font-semibold" style={{ color: "#d97706" }}>
                ⚠️ {report.details.ubicacion_aprox}
              </p>
            )}
          </Section>

          {(report.reporter_name || report.contact_phone) && (
            <Section title={t("detail.reportedBy")}>
              <p className="text-base font-bold" style={{ color: "var(--fg)" }}>{report.reporter_name || t("detail.anonymous")}</p>
              {report.contact_phone && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {reporterWa && (
                    <a
                      href={reporterWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white"
                      style={{ background: "#16a34a" }}
                    >
                      {t("contact.whatsapp")}
                    </a>
                  )}
                  <a
                    href={telLink(report.contact_phone)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold"
                    style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                  >
                    {t("contact.call")}
                  </a>
                </div>
              )}
            </Section>
          )}

          {report.media.length > 0 && (
            <Section title={t("detail.photo")}>
              <div className="flex flex-wrap gap-2">
                {report.media.map((m, i) =>
                  m.url ? (
                    <button
                      type="button"
                      key={m.url ?? i}
                      onClick={() => m.url && setLightbox(m.url)}
                      aria-label="Ampliar foto del reporte"
                      className="h-28 w-28 overflow-hidden rounded-xl"
                    >
                      <Image src={m.url} alt="Foto del reporte" width={112} height={112} className="h-full w-full object-cover" />
                    </button>
                  ) : null
                )}
              </div>
            </Section>
          )}

          {report.external ? (
            <Section title={t("detail.source")}>
              <p className="text-sm" style={{ color: "var(--fg-2)" }}>
                {tSplit("detail.source.external")[0]}
                <a href={report.external.url} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                  {report.external.source}
                </a>
                {tSplit("detail.source.external")[1]}
              </p>
            </Section>
          ) : (
            <>
              {report.sourceInfo && (
                <Section title={t("detail.source")}>
                  <p className="text-sm" style={{ color: "var(--fg-2)" }}>
                    {tSplit("detail.source.collected")[0]}
                    {report.sourceInfo.url ? (
                      <a href={report.sourceInfo.url} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                        {report.sourceInfo.source}
                      </a>
                    ) : (
                      <span className="font-bold">{report.sourceInfo.source}</span>
                    )}
                    {tSplit("detail.source.collected")[1]}
                  </p>
                </Section>
              )}

              <Section title={t("detail.verification")}>
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--fg-2)" }}>
                  <span>{t("detail.vc.confirm", { n: report.vc_confirm })}</span>
                  <span>{t("detail.vc.attended", { n: report.vc_attended })}</span>
                  <span>{t("detail.vc.incorrect", { n: report.vc_incorrect })}</span>
                  <span>{t("detail.vc.resolved", { n: report.vc_resolved, total: RESOLVE_THRESHOLD })}</span>
                </div>
              </Section>

              <ReportUpdates reportId={report.id} />
            </>
          )}
        </div>

        {lightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
          >
            <button type="button"
              onClick={() => setLightbox(null)}
              aria-label={t("common.close")}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
            >
              ×
            </button>
            <div onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox}
                alt=""
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        )}

        {(onVerify || onAttended || onFalse || onResolved || onViewMap) && (
          <div
            className="sticky bottom-0 mt-auto flex flex-col gap-2 p-5"
            style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
          >
            {feedback && (
              <div
                className="rounded-xl px-3 py-2 text-center text-xs font-bold"
                style={{ background: "rgba(22,163,74,.12)", color: "#15803d" }}
              >
                {feedback}
              </div>
            )}
            <div className="flex gap-2">
              {onVerify && (
                <ActionButton
                  onClick={act(onVerify, moderator ? t("detail.feedback.verify.mod") : t("detail.feedback.verify.citizen"))}
                  tone="green"
                >
                  {moderator ? t("detail.action.verify.mod") : t("detail.action.verify.citizen")}
                </ActionButton>
              )}
              {onAttended && (
                <ActionButton onClick={act(onAttended, t("detail.feedback.attended"))} tone="accent">
                  {t("detail.action.attended")}
                </ActionButton>
              )}
              {onFalse && (
                <ActionButton
                  onClick={act(onFalse, moderator ? t("detail.feedback.false.mod") : t("detail.feedback.false.citizen"))}
                  tone="red"
                >
                  {moderator ? t("detail.action.false.mod") : t("detail.action.false.citizen")}
                </ActionButton>
              )}
            </div>
            {onResolved && (
              <div className="flex">
                <ActionButton onClick={act(onResolved, t("detail.feedback.resolved"))} tone="accent">
                  {t("detail.action.resolved", { n: report.vc_resolved, total: RESOLVE_THRESHOLD })}
                </ActionButton>
              </div>
            )}
            {onViewMap && (
              <button type="button"
                onClick={onViewMap}
                className="h-11 rounded-xl border text-sm font-bold"
                style={{ borderColor: "var(--border)" }}
              >
                {t("common.viewMap")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-md px-2 py-1 text-[11px] font-bold"
      style={{ background: `${color}1f`, color }}
    >
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone: "green" | "red" | "accent";
  children: React.ReactNode;
}) {
  const styles =
    tone === "green"
      ? { borderColor: "rgba(22,163,74,.3)", background: "rgba(22,163,74,.08)", color: "#15803d" }
      : tone === "red"
      ? { borderColor: "rgba(220,38,38,.3)", background: "rgba(220,38,38,.08)", color: "#b91c1c" }
      : { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" };
  return (
    <button type="button" onClick={onClick} className="h-11 flex-1 rounded-xl border text-sm font-bold" style={styles}>
      {children}
    </button>
  );
}
