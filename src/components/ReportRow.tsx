"use client";

import { CATS, RESOLVE_THRESHOLD, Report, STATUS, TYPE_FIELDS } from "@/lib/types";

export function ReportRow({
  report,
  onClick,
  onVerify,
  onFalse,
  onDelete,
}: {
  report: Report;
  onClick?: () => void;
  onVerify?: () => void;
  onFalse?: () => void;
  onDelete?: () => void;
}) {
  const c = CATS[report.type];
  const st = STATUS[report.status];
  const showActions = onVerify || onFalse || onDelete;
  const photoUrl = report.media.find((m) => m.kind === "foto" && m.url)?.url;
  const keyFieldDef = TYPE_FIELDS[report.type]?.find((f) => report.details?.[f.key]);
  const keyFieldValue = keyFieldDef ? report.details[keyFieldDef.key] : null;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className="flex items-center gap-3.5 rounded-2xl border p-3"
      style={{ borderColor: "var(--border)", background: "var(--surface)", cursor: onClick ? "pointer" : "default" }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <span
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ background: "var(--surface-2)" }}
        >
          {c.emoji}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold">
          {keyFieldValue || c.label}
          {report.external && (
            <span className="ml-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
              🌐 externo
            </span>
          )}
        </div>
        <div className="truncate text-sm" style={{ color: "var(--muted)" }}>
          {keyFieldValue ? c.label : report.place}
        </div>
      </div>
      <span
        className="flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-bold"
        style={{ background: `${st.color}1a`, color: st.color }}
      >
        {st.label}
      </span>
      {showActions && (
        <div className="flex flex-shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onVerify && (
            <button type="button" onClick={onVerify} title="Marcar verificado" className="h-8 w-8 rounded-lg border text-sm" style={{ borderColor: "rgba(22,163,74,.3)", background: "rgba(22,163,74,.08)", color: "#15803d" }}>
              ✓
            </button>
          )}
          {onFalse && (
            <button type="button" onClick={onFalse} title="Marcar falso / spam" className="h-8 w-8 rounded-lg border text-sm" style={{ borderColor: "rgba(220,38,38,.3)", background: "rgba(220,38,38,.08)", color: "#b91c1c" }}>
              ⚑
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title={
                report.vc_resolved >= RESOLVE_THRESHOLD
                  ? "Eliminar"
                  : `Necesita más de 7 confirmaciones de que está resuelto (lleva ${report.vc_resolved})`
              }
              className="h-8 w-8 rounded-lg border text-sm"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-2)",
                color: report.vc_resolved >= RESOLVE_THRESHOLD ? "var(--muted)" : "var(--border)",
              }}
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}
