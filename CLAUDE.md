# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file emergency-response app for La Guaira, Venezuela ("Centro de Coordinación Ciudadana"): an interactive incident map, a multi-step report flow, and an admin moderation panel. It was authored in **Claude Designs** (the artifact format used by the Claude Desktop app), not as a standard web project — there is no build step, package manager, or test runner.

## Files

- `Centro de Coordinacion.dc.html` — the entire app: markup template + component logic, in the `.dc.html` format (see below). This is the only file you'll normally edit.
- `support.js` — the `dc-runtime` engine that parses `.dc.html` and renders it via React/ReactDOM. **Generated, do not hand-edit** (header comment: "GENERATED from dc-runtime/src/*.ts — rebuild with `cd dc-runtime && bun run build`", but that source isn't part of this repo — treat it as a vendored dependency).
- `ios-frame.jsx` — a standalone iOS device-frame component (`IOSDevice`, status bar, nav bar, etc.) used to preview the mobile app view inside a phone bezel. No external deps.
- `thumbnail.webp` — preview image for the artifact.
- `.agents/skills/` — Agent Skills installed via `autoskills` (frontend-design, seo, accessibility). `skills-lock.json` tracks installed versions.

## The `.dc.html` format

This is Claude's proprietary artifact format, not plain HTML:

- `<x-dc>` wraps the whole template; its innerHTML is parsed and rendered through React.
- `{{ expression }}` interpolates JS expressions evaluated against the component instance (state/props/methods).
- `<sc-if value="{{ cond }}">` — conditional rendering blocks.
- `<x-import component-from-global-scope="Name" from="./file.jsx">` — imports a component defined in another file (used here to pull in `IOSDevice` from `ios-frame.jsx`).
- `<script type="text/x-dc" data-dc-script data-props="...">` (near the bottom of the file, currently line ~542) contains the actual logic:
  ```js
  class Component extends DCLogic {
    state = { ... }
    componentDidMount() { ... }
    someHandler = () => this.setState(...)
    renderVals() { /* returns the object whose keys are referenced by {{ }} in the template */ }
  }
  ```
  `data-props` declares editable artifact props (`defaultTheme`, `accentColor`, `scenarioCity`) with their editor type and defaults — these surface as configurable inputs in Claude Designs' UI.
- `DCLogic` is an alias the runtime provides for its internal `StreamableLogic` base class (see `support.js`).

To work in this file: find `class Component extends DCLogic` near the end, edit state/handlers/methods there, and edit the markup/`{{ }}` bindings above it in the `<x-dc>` block. `renderVals()` is the bridge — it computes the derived values (labels, colors, formatted strings) that the template interpolates.

## Architecture (within `Component`)

- **Two top-level views**: `state.view` is `'app'` (mobile, wrapped in `<IOSDevice>`) or `'admin'` (desktop panel). Both share the same `reports` state and Leaflet map logic.
- **Mock data**: `state.reports` is a hardcoded array of incident objects (`{ id, type, lat, lng, place, desc, urgency, status, people, mins, confidence, vc, name, media }`). There is no backend — everything is client-side, in-memory, reset on reload.
- **Lookup tables** define the domain vocabulary and drive both styling and labels: `CATS` (incident types → emoji/color/label), `STATUS`, `URG` (urgency levels), `THEMES` (light/dark CSS variable sets).
- **Leaflet maps**: `initAppMap()`, `initAdminMap()`, `initMini()` set up separate Leaflet instances per view; `renderMarkers(map, layer)` redraws pins on every relevant state change (see `componentDidUpdate`). Custom pin icons come from `_icon(r)` (HTML divIcon, pulsing ring for `urgencia: critica`).
- **Report flow**: `state.showReport` + `state.reportStep` (0–4) drive a multi-step form; `state.draft` holds in-progress input; `submitReport()` pushes a new report (or queues it if `state.offline`).
- **Verification / moderation**: `verify(id, kind)` (citizen-side: confirm/attended/incorrect, adjusts `confidence`) vs. `modAction(id, action)` (admin-side: verify/false/delete).
- **Derived display data**: `_disp(r)` decorates a raw report with resolved labels/colors/relative time for rendering — call this rather than reaching into `CATS`/`STATUS`/`URG` directly when adding new UI that displays a report.
- Theme application is imperative (`applyTheme()` sets CSS variables directly on `#ccc-root`), not purely declarative — keep that in mind when changing tile/theme-dependent UI in `componentDidUpdate`.

## Running / previewing

There's no dev server in this repo. To preview changes, re-import/open the `.dc.html` file in Claude Desktop (Claude Designs), since it depends on `support.js`'s runtime plus React/ReactDOM/Leaflet loaded from the CDN links in the `<helmet>` block at the top of the file.

## Roadmap (from the original design plan)

1. Mapa interactivo (Leaflet/OSM, La Guaira, pines + filtros + capas + leyenda) — done
2. Flujo de reportar incidente (multi-paso + media + IA) — base flow done, IA assist pending
3. Pantalla de detalle (estados, verificación comunitaria, confianza) — done
4. Administrador del panel (dashboard, estadísticas, mapa, moderación, IA) — moderation actions done, stats/IA pending
5. Tema claro/oscuro + offline + pulido + verificación — theme + offline toggle done
