# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A citizen emergency-response app for the La Guaira earthquake (Venezuela): an interactive incident map and a multi-step report flow covering missing/found/deceased persons, structural emergencies, health-supply needs, shelters/resources, and lost/found pets — plus an admin dashboard for verification and moderation.

## Commands

```bash
npm run dev      # dev server (Turbopack), http://localhost:3000
npm run build    # production build, also runs the TypeScript check
npm run lint     # ESLint (legacy/ is excluded, see eslint.config.mjs)
```

There is no test suite yet.

## Architecture

Next.js App Router, almost entirely client components — the data (Supabase Postgres + Realtime) is fetched and subscribed to in the browser, so there isn't much server-rendering value here beyond the initial HTML shell.

- `src/lib/types.ts` — the domain model and single source of truth for report categories: `CATS` (label/emoji/color per type), `TYPE_FIELDS` (which extra inputs the report form shows for each type — e.g. `persona_desaparecida` asks for name/age/last-seen, `hospital_insumos` asks for which supplies are missing), `PEOPLE_COUNT_TYPES` (which types show the "people affected" counter — informational types like wifi/water points don't), `STATUS`/`URG` lookups, and the `Draft` type used while filling out the report form.
- `src/lib/supabase.ts` — Supabase client, reads `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` from env (throws at import time if missing — see `.env.example`).
- `src/lib/reports.ts` — all report CRUD (`fetchReports`, `submitReport`, `verifyReport` for citizen confirm/attended/incorrect, `moderateReport` for admin verify/false/delete) plus `uploadPhoto`, which **compresses images client-side via canvas before upload** (resize to 1600px, JPEG q=0.72) — this matters because Supabase's free Storage tier is small and uncompressed phone photos would burn through it fast. Deleting a report also deletes its associated Storage files (`moderateReport(..., "delete")`), otherwise photos become permanently orphaned.
- `src/hooks/useReports.ts` — the one hook every report-related UI uses. Wraps the lib functions with React state, a `postgres_changes` Realtime subscription (so reports submitted/edited by another connected user appear live), and a simple in-memory offline queue (`submit(..., offline=true)` queues instead of writing; `flushQueue()` drains it).
- `src/hooks/usePresence.ts` — connected-user count via a Supabase Realtime **Presence** channel (not a real auth/user system — it's an honest "how many browser tabs are open right now" count, replacing what used to be a hardcoded fake number).
- `src/components/ReportMap.tsx` — Leaflet via `react-leaflet`. **Must be loaded with `next/dynamic(..., { ssr: false })`** wherever it's used — Leaflet touches `window` at import time and will break SSR otherwise. Custom pin icons are built per-report from `CATS` (color/emoji), with a pulsing ring for `urgencia: critica`.
- `src/components/ReportForm.tsx` — the multi-step report flow (type → location → type-specific details → urgency/contact → review). The "details" step renders inputs dynamically from `TYPE_FIELDS[draft.type]`, so adding a new report type's fields means editing `types.ts` only, not this component.
- `src/app/page.tsx` — citizen-facing app: map + filter chips + the floating "Reportar" button + report detail sheet.
- `src/app/admin/page.tsx` — admin dashboard with sidebar sections (`Resumen`, `Reportes` = full list, `Moderación` = only `sin_verificar`). `Mapa operativo` / `Asistente IA` / `Usuarios` nav items exist but are intentionally unimplemented placeholders — don't be surprised they're inert, that's current state, not a bug.

## Data model

Backed by a single Supabase Postgres table, `reports` (see `supabase/schema.sql` plus the two follow-up migration files in that folder, already applied to the shared project — they're kept for history/onboarding, not meant to be re-run blindly). Key columns: `type` (the `ReportType` union, enforced by a `CHECK` constraint — adding a new type requires both a migration to extend that constraint *and* an entry in `CATS`/`TYPE_FIELDS`), `details` (jsonb, free-form per-type fields), `media` (jsonb array of `{ kind, url? }`), plus the usual lat/lng/place/urgency/status/confidence/vc_* verification counters.

RLS policies are deliberately open (`using (true)`) for select/insert/update/delete — there's no auth system, this is a public citizen-reporting tool. If a moderator login is added later, the update/delete policies are the ones that need tightening.

## `legacy/`

The original implementation, built as a Claude Designs `.dc.html` artifact (custom template DSL + a bundled React runtime). Kept for reference only; not part of the Next.js app and not linted (excluded in `eslint.config.mjs`).
