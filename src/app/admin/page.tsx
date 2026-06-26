import { notFound } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

// El panel de admin está deliberadamente desactivado en el sitio público:
// no hay login todavía, así que cualquiera con la URL podría moderar/eliminar
// reportes. Para usarlo localmente, agrega ADMIN_PANEL_ENABLED=true a .env.local.
export default function AdminPage() {
  if (process.env.ADMIN_PANEL_ENABLED !== "true") {
    notFound();
  }
  return <AdminDashboard />;
}
