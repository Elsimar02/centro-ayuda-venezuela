# Centro de Coordinación Ciudadana

App de respuesta a emergencias para La Guaira: mapa interactivo, reporte de incidentes y panel de administración.

## Origen del proyecto

Este diseño se creó con **Claude Designs** (app de escritorio Claude). El formato no es HTML/React estándar:

- `Centro de Coordinacion.dc.html` — plantilla del diseño, usa una sintaxis propia (`<x-dc>`, `<sc-if>`, `<x-import>`, `{{ expresiones }}`).
- `support.js` — runtime (`dc-runtime`) generado por Claude que interpreta esa plantilla sobre React/ReactDOM. **No editar a mano** (ver el comentario en la cabecera del archivo).
- `ios-frame.jsx` — componente del marco de iPhone usado en la vista previa de app móvil.
- `thumbnail.webp` — miniatura de vista previa.

## Plan de trabajo (definido en el diseño original)

1. Mapa interactivo (Leaflet/OSM, La Guaira, pines + filtros + capas + leyenda)
2. Flujo de reportar incidente (multi-paso + media + IA)
3. Pantalla de detalle (estados, verificación comunitaria, confianza)
4. Administrador del panel (dashboard, estadísticas, mapa, moderación, IA)
5. Tema claro/oscuro + offline + pulido + verificación

## Cómo seguir trabajando

Por ahora el archivo principal sigue dependiendo del runtime propietario de Claude Designs. Próximo paso recomendado: decidir si se sigue editando en este formato (re-importable a Claude Designs) o se migra a un stack estándar (React + Vite) para facilitar colaboración fuera de Claude.
