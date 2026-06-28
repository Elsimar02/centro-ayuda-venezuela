"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES, useLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("common.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-base"
        style={{ borderColor: "var(--border)" }}
      >
        {current.flag}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-xl border shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {LANGUAGES.map((l) => (
            <button
              type="button"
              key={l.id}
              role="option"
              aria-selected={l.id === lang}
              onClick={() => {
                setLang(l.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-bold"
              style={{
                background: l.id === lang ? "var(--accent-soft)" : "transparent",
                color: l.id === lang ? "var(--accent)" : "var(--fg)",
              }}
            >
              <span className="text-base">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
