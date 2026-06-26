"use client";

import { CATS, Report, STATUS } from "@/lib/types";

function timeAgo(createdAt: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (m <= 0) return "ahora";
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

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

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: "1px solid var(--border-2)", cursor: onClick ? "pointer" : "default" }}
    >
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: `${c.color}24` }}
      >
        {c.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{c.label}</div>
        <div className="truncate text-xs" style={{ color: "var(--muted)" }}>
          {report.place} · {timeAgo(report.created_at)}
        </div>
      </div>
      <span
        className="flex-shrink-0 rounded-md px-2 py-1 text-[10px] font-bold"
        style={{ background: `${st.color}24`, color: st.color }}
      >
        {st.label}
      </span>
      {showActions && (
        <div className="flex flex-shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onVerify && (
            <button onClick={onVerify} title="Marcar verificado" className="h-8 w-8 rounded-lg border text-sm" style={{ borderColor: "rgba(22,163,74,.3)", background: "rgba(22,163,74,.08)", color: "#15803d" }}>
              ✓
            </button>
          )}
          {onFalse && (
            <button onClick={onFalse} title="Marcar falso / spam" className="h-8 w-8 rounded-lg border text-sm" style={{ borderColor: "rgba(220,38,38,.3)", background: "rgba(220,38,38,.08)", color: "#b91c1c" }}>
              ⚑
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} title="Eliminar" className="h-8 w-8 rounded-lg border text-sm" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}
