"use client";

import { CATS, PEOPLE_COUNT_TYPES, Report, SHOW_URGENCY_TYPES, STATUS, TYPE_FIELDS, URG } from "@/lib/types";

function timeAgo(createdAt: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (m <= 0) return "ahora";
  if (m < 60) return `hace ${m} min`;
  if (m < 60 * 24) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} d`;
}

export function ReportDetailPanel({
  report,
  onClose,
  onVerify,
  onFalse,
  onAttended,
  onViewMap,
}: {
  report: Report;
  onClose: () => void;
  onVerify?: () => void;
  onFalse?: () => void;
  onAttended?: () => void;
  onViewMap?: () => void;
}) {
  const cat = CATS[report.type];
  const st = STATUS[report.status];
  const fields = TYPE_FIELDS[report.type] || [];
  const showPeople = PEOPLE_COUNT_TYPES.has(report.type);
  const showUrgency = SHOW_URGENCY_TYPES.has(report.type);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal>
      <div
        className="absolute inset-0"
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
              <div className="text-sm font-extrabold leading-tight">{cat.label}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(report.created_at)}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-xl" aria-label="Cerrar">×</button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={st.color}>{st.label}</Badge>
            {showUrgency && <Badge color={URG[report.urgency].color}>Urgencia: {URG[report.urgency].label}</Badge>}
            {showPeople && <Badge color="var(--muted)">{report.people} persona(s) afectadas</Badge>}
          </div>

          <Section title="Descripción">
            <p className="text-sm" style={{ color: "var(--fg-2)" }}>
              {report.description || "Sin descripción."}
            </p>
          </Section>

          {fields.length > 0 && (
            <Section title="Detalles">
              <div className="flex flex-col gap-2.5">
                {fields.map((f) => {
                  const value = report.details?.[f.key];
                  if (!value) return null;
                  return (
                    <div key={f.key}>
                      <div className="text-xs font-bold" style={{ color: "var(--muted)" }}>{f.label}</div>
                      <div className="text-sm" style={{ color: "var(--fg-2)" }}>{value}</div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          <Section title="Ubicación">
            <p className="text-sm" style={{ color: "var(--fg-2)" }}>📍 {report.place}</p>
          </Section>

          {(report.reporter_name || report.contact_phone) && (
            <Section title="Reportado por">
              <p className="text-sm" style={{ color: "var(--fg-2)" }}>
                {report.reporter_name || "Anónimo"}
                {report.contact_phone ? ` · ${report.contact_phone}` : ""}
              </p>
            </Section>
          )}

          {report.media.length > 0 && (
            <Section title="Foto">
              <div className="flex flex-wrap gap-2">
                {report.media.map((m, i) =>
                  m.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={m.url} alt="Foto del reporte" className="h-28 w-28 rounded-xl object-cover" />
                  ) : null
                )}
              </div>
            </Section>
          )}

          <Section title="Verificación ciudadana">
            <div className="flex gap-4 text-sm" style={{ color: "var(--fg-2)" }}>
              <span>✓ {report.vc_confirm} confirmaron</span>
              <span>🏁 {report.vc_attended} atendido</span>
              <span>⚑ {report.vc_incorrect} incorrecto</span>
            </div>
          </Section>
        </div>

        {(onVerify || onAttended || onFalse || onViewMap) && (
          <div
            className="sticky bottom-0 mt-auto flex flex-col gap-2 p-5"
            style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
          >
            <div className="flex gap-2">
              {onVerify && (
                <ActionButton onClick={onVerify} tone="green">✓ Verificado</ActionButton>
              )}
              {onAttended && (
                <ActionButton onClick={onAttended} tone="accent">Marcar atendido</ActionButton>
              )}
              {onFalse && (
                <ActionButton onClick={onFalse} tone="red">⚑ Falso</ActionButton>
              )}
            </div>
            {onViewMap && (
              <button
                onClick={onViewMap}
                className="h-11 rounded-xl border text-sm font-bold"
                style={{ borderColor: "var(--border)" }}
              >
                Ver en mapa
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
    <button onClick={onClick} className="h-11 flex-1 rounded-xl border text-sm font-bold" style={styles}>
      {children}
    </button>
  );
}
