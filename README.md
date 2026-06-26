# Centro de Coordinación Ciudadana

App de respuesta a emergencias para La Guaira, Venezuela: mapa interactivo de reportes (personas, rescates, salud, refugios, mascotas, etc.) y panel de administración para verificación/moderación.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Supabase**: Postgres (tabla `reports`), Storage (fotos comprimidas en el navegador antes de subir) y Realtime (sincronización en vivo + contador de usuarios conectados)
- **Leaflet** / **react-leaflet** para el mapa

## Cómo correr el proyecto

```bash
npm install
cp .env.example .env.local   # completa con las credenciales de Supabase (pídeselas a Elsimar)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `src/app/page.tsx` — vista ciudadana (mapa + reportar)
- `src/app/admin/page.tsx` — panel de administración (Resumen / Reportes / Moderación)
- `src/components/` — `ReportMap`, `ReportForm` (formulario multi-paso), `ReportRow`
- `src/hooks/` — `useReports` (fetch + realtime + CRUD), `usePresence` (conectados en vivo)
- `src/lib/types.ts` — categorías de reportes, campos específicos por tipo, lookups de estado/urgencia
- `src/lib/supabase.ts`, `src/lib/reports.ts` — cliente y funciones de datos
- `supabase/*.sql` — migraciones ya ejecutadas en el proyecto de Supabase compartido (quedan aquí como referencia/historial)
- `legacy/` — la versión anterior del proyecto, hecha como artifact de Claude Designs (`.dc.html`). Se conserva solo de referencia, ya no se mantiene.

## Variables de entorno

Ver `.env.example`. Ambas variables son públicas por diseño (claves `anon`/`publishable` de Supabase, protegidas con Row Level Security, no son secretas).
