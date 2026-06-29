"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { useExternalPets } from "@/hooks/useExternalPets";
import { useExternalVolunteers } from "@/hooks/useExternalVolunteers";
import { usePresence } from "@/hooks/usePresence";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ReportRow } from "@/components/ReportRow";
import { ReportForm } from "@/components/ReportForm";
import { ReportDetailPanel } from "@/components/ReportDetailPanel";
import { CitizenMapView } from "@/components/CitizenMapView";
import { SeismicActivity } from "@/components/SeismicActivity";
import { FILTER_DISCLAIMERS, MAP_FILTERS, Report, ReportType } from "@/lib/types";
import { telLink } from "@/lib/contact";

const ReportMap = dynamic(() => import("@/components/ReportMap"), { ssr: false });

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://centrocooperativovenezuela.com";

const NAV = [
  { id: "resumen", icon: "📊", label: "Resumen" },
  { id: "reportes", icon: "📋", label: "Reportes" },
  { id: "moderacion", icon: "🛡️", label: "Moderación" },
  { id: "mapa", icon: "🗺️", label: "Mapa operativo" },
  { id: "grupos", icon: "💬", label: "Grupos de comunicación" },
  { id: "encuentro_seguro", icon: "👨‍👩‍👧", label: "Encuentro Seguro" },
  { id: "donaciones", icon: "💜", label: "Donaciones" },
  { id: "telefonos", icon: "☎️", label: "Teléfonos de emergencia" },
  { id: "voluntariado", icon: "🤝", label: "Voluntariado" },
  { id: "ingenieros", icon: "🏗️", label: "Ingenieros estructurales" },
  { id: "tutorial", icon: "📖", label: "Tutorial" },
] as const;

const COMM_GROUPS = [
  {
    id: "venezuela-te-busca",
    name: "Venezuela Te Busca",
    icon: "🔎",
    desc: "Plataforma ciudadana para registrar y buscar personas desaparecidas tras el terremoto.",
    url: "https://www.desaparecidosvenezuela.com/",
    cta: "Buscar o registrar a alguien",
  },
] as const;

const ENCUENTRO_SEGURO_LINKS = [
  {
    id: "reencuentro-seguro",
    name: "Encuentro Seguro",
    icon: "👨‍👩‍👧",
    desc: "Plataforma de reunificación familiar para niños, niñas y adolescentes separados de sus familias tras el terremoto. Permite a familiares iniciar una búsqueda, a hospitales/refugios registrar menores sin acompañante, y consultar el estado de un caso con código y PIN. No publica fotos ni ubicaciones de los niños; todo reencuentro requiere verificación presencial.",
    url: "https://reencuentroseguro.com",
    cta: "Ir a Encuentro Seguro",
  },
] as const;

const DONATION_LINKS = [
  {
    id: "yummy",
    name: "Yummy",
    icon: "💜",
    desc: "Yummy (la empresa de delivery y transporte más grande de Venezuela) hace matching del 25% de tu donación, hasta $100,000.",
    url: "https://dona.yummyrides.com",
    cta: "Donar en Yummy",
  },
  {
    id: "caritas",
    name: "Cáritas Venezuela",
    icon: "⛪",
    desc: "Organización de promoción y asistencia social de la Iglesia Católica en Venezuela.",
    url: "https://caritasvenezuela.org/donaciones/",
    cta: "Donar en Cáritas",
  },
  {
    id: "hogar-bambi",
    name: "Hogar Bambi Venezuela",
    icon: "🧒",
    desc: "Vía GlobalGiving: atención integral (salud, educación, alimentación, protección legal) a 120 niños huérfanos o abandonados en Caracas.",
    url: "https://www.globalgiving.org/projects/integral-support-program-for-children/",
    cta: "Donar en GlobalGiving",
  },
] as const;

// Fuente: redayudavenezuela.com (entradas curadas, no publicaciones de usuarios individuales).
const VOLUNTEER_ORGS = [
  {
    name: "Cruz Roja Venezolana — Hazte voluntario",
    desc: "Principal organización humanitaria en terreno (rescate, albergues, atención médica y apoyo psicosocial). Reclutan todo el año, sin experiencia previa (te capacitan), desde los 15 años.",
    contact: "cruzroja.ve/haz-voluntariado · IG @cruzrojave · caracas@cruzroja.ve",
  },
  {
    name: "Cáritas de Venezuela — Voluntariado y acopio",
    desc: "Red de la Iglesia Católica (~30.000 voluntarios) que coordina centros de acopio y respuesta a la emergencia. Ofrécete o lleva donaciones. Sede: Av. Teherán, a 200 m de la UCAB, Montalbán, Caracas.",
    contact: "0212-443-3153 · caritasvenezuela@gmail.com · IG @caritasdevzla",
  },
  {
    name: "Protección Civil — Voluntariado formal",
    desc: "Organismo oficial de gestión de desastres. Los grupos voluntarios requieren registro previo y formación (no es voluntariado espontáneo). Sede: Av. Principal de Bello Monte, Caracas.",
    contact: "0800-7248451 (0800-PCIVIL1) · IG @pcivil_venezuela",
  },
  {
    name: "PsicoLínea UCAB — Apoyo psicológico",
    desc: "Línea gratuita y confidencial de primeros auxilios psicológicos de la Escuela de Psicología de la UCAB; útil para afectados y para psicólogos que quieran apoyar. Confirma el número y horario en psicologia.ucab.edu.ve antes de llamar.",
    contact: "0414-1217882 / 0424-1723981 (confirmar)",
  },
  {
    name: "Arquidiócesis de Caracas — Parroquias solidarias",
    desc: "Llamado del arzobispo a activar redes de solidaridad. Centros en Parroquia El Buen Pastor (Bello Campo, Chacao), La Sagrada Familia (La Tahona) y Cáritas Nacional (Montalbán). Lleva donaciones o súmate.",
    contact: "IG @arquidiocesisdecaracas",
  },
] as const;

// Fuente: redayudavenezuela.com. Sin dirección puntual (solo redes sociales),
// por eso van como tarjetas informativas y no como pines en el mapa.
const PET_RESOURCES = [
  {
    name: "Fundación Rescate Garra & Pata",
    desc: "Fundación de rescate, alimentación y adopción de perros y gatos en Caracas. Tras el sismo moviliza equipos de rescate.",
    contact: "IG @fundrescategarraypata",
  },
  {
    name: "Misión Nevado — atención veterinaria gratuita",
    desc: "Programa estatal con más de 71 centros de atención veterinaria gratuita a nivel nacional, incluido el estado La Guaira.",
    contact: "IG @misionnevadooficial",
  },
] as const;

// Fuente: redayudavenezuela.com. Puntos de acopio fuera de Venezuela para
// quienes quieren enviar insumos para mascotas desde la diáspora.
const DIASPORA_PET_DROPOFFS = [
  {
    name: "Global Empowerment Mission (Doral, Florida)",
    address: "1850 NW 84th Ave, Ste. 100, Doral, FL 33126, EE.UU. · Lun-vie 8 a.m.–5 p.m.",
    desc: "Recibe comida de perros/gatos, correas y juguetes para enviar a Venezuela.",
  },
  {
    name: "Alcaldía de Panamá — Edificio Hatillo",
    address: "Planta baja, Edificio Hatillo, Ciudad de Panamá · 8 a.m.–4 p.m.",
    desc: "Recibe alimento de perros/gatos para enviar a Venezuela.",
  },
] as const;

// Fuente: redayudavenezuela.com
const HOSPITALS_CARACAS = [
  { name: "Hospital José Gregorio Hernández (Los Magallanes)", phones: ["(0212) 870.78.97"] },
  { name: "Hospital Miguel Pérez Carreño (Bella Vista)", phones: ["(0212) 472.84.72"] },
  { name: "Hospital Militar (San Martín)", phones: ["(0212) 406.12.41"] },
  { name: "Hospital Periférico de Catia (Catia)", phones: ["(0212) 870.27.71"] },
  { name: "Hospital Periférico de Coche (Coche)", phones: ["(0212) 681.11.33"] },
  { name: "Policlínica David Lobo (Santa Rosalía)", phones: ["(0212) 541.54.65"] },
  { name: "Policlínica La Arboleda (San Bernardino)", phones: ["(0212) 550.18.11"] },
  { name: "Policlínica Las Mercedes (Las Mercedes)", phones: ["(0212) 993.23.23"] },
  { name: "Policlínica Santiago de León (Sabana Grande)", phones: ["(0212) 762.90.25"] },
] as const;

const EMERGENCY_LINES = [
  { name: "Cantv (desde fijo)", phones: ["171"] },
  { name: "Movilnet", phones: ["*1"] },
  { name: "Digitel", phones: ["112"] },
  { name: "Movistar", phones: ["911"] },
] as const;

// Números de emergencia a nivel nacional (no por operadora) — se muestran
// fijos en el sidebar, visibles sin importar la sección activa.
const NATIONAL_EMERGENCY_NUMBERS = [
  { number: "911", label: "Emergencia nacional", tone: "primary" as const },
  { number: "166", label: "Protección Civil", tone: "default" as const },
  { number: "167", label: "Bomberos", tone: "default" as const },
] as const;

const PROTECCION_CIVIL_REPORTE = {
  title: "Protección Civil — reporte nacional",
  desc: "Línea gratuita para reportar daños estructurales, derrumbes o solicitar inspección.",
  phone: "0800-7248451",
};

const AMBULANCES = [
  { name: "Aeroambulancias", phones: ["(0212) 993.25.41", "(0212) 992.89.80", "(0212) 992.89.90", "(0212) 991.79.40"] },
  { name: "Rescarven", phones: ["(0212) 993.69.11", "(0212) 993.69.91", "(0212) 993.13.10", "(0212) 993.33.67"] },
  { name: "Servicio de Ambulancia Metropolitano", phones: ["(0212) 545.45.45", "(0212) 545.46.55", "(0212) 577.92.09"] },
] as const;

const FIREFIGHTERS = [
  { name: "Antímano", phones: ["(0212) 472.20.54"] },
  { name: "Catia la Mar", phones: ["(0212) 351.99.66"] },
  { name: "Chacao", phones: ["(0212) 265.32.61"] },
  { name: "del Este (Cafetal)", phones: ["(0212) 987.43.34", "(0212) 985.50.60"] },
  { name: "Sucre", phones: ["(0212) 985.36.40"] },
  { name: "El Cafetal", phones: ["(0212) 985.36.40", "(0212) 985.29.77"] },
  { name: "El Paraíso", phones: ["(0212) 481.09.61"] },
  { name: "El Valle", phones: ["(0212) 672.01.75", "(0212) 672.06.36"] },
  { name: "La Guaira", phones: ["(0212) 332.76.20", "(0212) 331.04.45"] },
  { name: "La Trinidad", phones: ["(0212) 943.43.61"] },
  { name: "La Urbina", phones: ["(0212) 241.66.41"] },
  { name: "Metropolitanos", phones: ["(0212) 545.45.45"] },
  { name: "Miranda", phones: ["(0212) 235.69.67"] },
  { name: "Plaza Venezuela", phones: ["(0212) 793.00.39", "(0212) 793.64.57"] },
  { name: "San Bernardino", phones: ["(0212) 577.92.09"] },
] as const;

// Fuente: @fceunimet (Instagram) — "Directorio Estructural", ingenieros civiles
// egresados de distintas universidades venezolanas, voluntarios para consultas
// estructurales gratis (remotas y presenciales) tras el terremoto del 24/6.
const STRUCTURAL_ENGINEERS = [
  { name: "Aitor Fernandez — Unimet (2026) · Los Samanes", phones: ["+58 414-4716351"] },
  { name: "Alejandra Alibrandi — Unimet (2017) · Sebucán", phones: ["04146858882"] },
  { name: "Alejandro Jaspe — UDO (2022) · El Tigre", phones: ["04248157440"] },
  { name: "Alessandro Flora — UCV (2023) · Caracas", phones: ["+584142260133"] },
  { name: "Alessandra Mazzaglia — Unimet (2026) · Santa Fe", phones: ["04142102929"] },
  { name: "Ana Pacanins — Unimet (2019) · Altamira", phones: ["04241070817"] },
  { name: "Andrés García — UCAB (2023) · Terrazas del Ávila", phones: ["04123525039"] },
  { name: "Angel Lacruz — UCAB (2023) · San Bernardino", phones: ["04164211858"] },
  { name: "Angel Marchena — UCV (2023) · El Paraíso", phones: ["04126133311"] },
  { name: "Angello Sánchez — UCAB (2024) · Los Teques", phones: ["04241894136"] },
  { name: "Arian Mier y Teran — Unimet (2024) · Hatillo", phones: ["04241920209"] },
  { name: "Arianna Arenare — Unimet (2025) · Colinas de Bello Monte", phones: ["0424-2543583"] },
  { name: "Bárbara Colmenares — UCV (2026) · Las Mercedes", phones: ["04241331888"] },
  { name: "Blady Molina — Unimet (2024) · Palo Verde", phones: ["04149725267"] },
  { name: "Brayan Malavé — UNEFA (2023) · La California", phones: ["04149017864"] },
  { name: "Carlos Espinoza — UNEFA (2015) · Ciudad Bolívar", phones: ["04148565487"] },
  { name: "Cesar Baute — Unimet (2024) · Santa Paula, El Cafetal", phones: ["+58 4241512494"] },
  { name: "Cristina Hurtado — Unimet (2024) · Los Samanes", phones: ["+584143137185"] },
  { name: "Daniel Hung — UCV (1985) · Los Ruices", phones: ["04129891838"] },
  { name: "Daniela Castillo — Unimet (2023) · El Hatillo", phones: ["04146567867"] },
  { name: "David Gutiérrez — USM (2011) · Urb. Miranda", phones: ["04242525273"] },
  { name: "Diego Maceira — Unimet (2023) · El Cafetal", phones: ["04222889740"] },
  { name: "Dionicio Romero — UCAB (2025) · España", phones: ["+34 623164500"] },
  { name: "Eduardo Alvarado — UCAB (2025) · Av. San Martín", phones: ["04129097198"] },
  { name: "Eduardo Rivera — UCAB (2024) · Caracas", phones: ["04241307632"] },
  { name: "Elizabeth Superlano — Unimet (2021) · Barcelona, España", phones: ["+34 656499650"] },
  { name: "Elvis Páez — UNEFA (2023) · El Valle", phones: ["04242788442"] },
  { name: "Emely Mahfoud — UCV (2023) · Caracas", phones: ["04129909853"] },
  { name: "Erika Hernández Berú — UCAB, Esp. Estructural (2017) · San Cristóbal, Táchira", phones: ["04163760186"] },
  { name: "Ernesto Covuccia — Unimet (2026) · El Hatillo", phones: ["04242871396"] },
  { name: "Ernesto Pullas — UCAB (2021) · San Bernardino", phones: ["04128005415"] },
  { name: "Esther Rodríguez — Univ. de Carabobo (2008) · Montevideo, Uruguay", phones: ["+59892318555"] },
  { name: "Euri Ardila — Univ. del Táchira (2023) · San Cristóbal, Táchira", phones: ["04143752613"] },
  { name: "Fabiana Orellana — Unimet (2021) · USA", phones: ["+13213154097"] },
  { name: "Genesis Moreno — Unimet (2026) · Terrazas del Club Hípico", phones: ["04142736398"] },
  { name: "Génesis Morales — UCAB (2025) · Av. Libertador", phones: ["04141553677"] },
  { name: "Gianfranco Ponzo — UNEFA / IMME (2013) · Isla de Margarita", phones: ["+584148926161"] },
  { name: "Henry Sarmiento — UCV (2009) · La Victoria, Aragua", phones: ["04163424559"] },
  { name: "Hugo Villalobos — UCAB (2021) · La Alta Florida", phones: ["+584243479698"] },
  { name: "Isabella Valverde — Unimet (2024) · El Cafetal", phones: ["+584120130202"] },
  { name: "Iván Salas — UCAB (2018) · San Agustín del Norte", phones: ["04142417745"] },
  { name: "Ivan De Rugeriis — Unimet (2024) · Urbanización Miranda", phones: ["04142665232"] },
  { name: "Javier Torres Sivoli — Univ. de La Plata, Argentina (2021) · Madrid", phones: ["+34661876615"] },
  { name: "Jesús Alarze — UCV (2017) · Alto Prado", phones: ["04241462393"] },
  { name: "Johan Cobo — IUP Santiago Mariño (2012) · Prados de María", phones: ["04144557642"] },
  { name: "Jonathan Guerra — USM (2002) · Guarenas", phones: ["04122940188"] },
  { name: "José Ángel Bernal Pérez — UJMV (1997) · Altos Mirandinos", phones: ["0412-0122864"] },
  { name: "Jose Ramirez — IUP Santiago Mariño Maracay (2020) · Turmero, Aragua", phones: ["04121995345"] },
  { name: "Josue Gonzalez — UCAB (2024) · Caracas", phones: ["+584222465717"] },
  { name: "Josue Maldonado — UPT Mérida (2025) · Distrito Capital", phones: ["04247126476"] },
  { name: "Juan Pablo Arocha — Unimet (2025) · Los Chorros", phones: ["04143787518"] },
  { name: "Kenyer Carrasquel — UCV (2018) · Coche", phones: ["04120113607"] },
  { name: "Kenji Ramírez — Unimet (2026) · El Cafetal", phones: ["04241734069"] },
  { name: "Kevin Zerpa — UCAB (2024) · Los Dos Caminos", phones: ["04129803113"] },
  { name: "Leopoldo Lecuna — Unimet (2023) · Los Palos Grandes", phones: ["04140110114"] },
  { name: "Leyda Pérez — TSU Diseño Interior y Construcción Civil (2012) · Coche", phones: ["04142330155"] },
  { name: "Loredana Espinoza — Unimet (2025) · Carrizal, Miranda", phones: ["04140201259"] },
  { name: "Luis Baldó — UCAB (2026) · Chacao", phones: ["04127055652"] },
  { name: "Luis Bayuelo — Unimet (2004) · Terrazas de Mampote", phones: ["04143005146"] },
  { name: "Luis Larrazabal — Unimet (2025) · Cumbres de Curumo", phones: ["04241360755"] },
  { name: "Luís Escalona — UCV / USM (2018) · Chacao/Los Palos Grandes", phones: ["04126001480"] },
  { name: "Manuel Orozco — Unimet (2024) · La Florida", phones: ["04242996706"] },
  { name: "Manuel Pagá — Unimet (2022) · Macaracuay", phones: ["04242642244"] },
  { name: "Manuel Tapia U — Unimet (1985) · Caracas", phones: ["04120119155"] },
  { name: "Marco Antonio Polo Cepeda — UCAB (2024) · Prados del Este", phones: ["04128126021"] },
  { name: "Marcos Rodriguez — Unimet (1992) · El Cafetal", phones: ["04149442569"] },
  { name: "María Daniela Avendaño — Unimet (2025) · Santa Fe", phones: ["04243063273"] },
  { name: "Maria Estefania Parra — ULA (2019) · Caracas", phones: ["04126730738"] },
  { name: "Maria Fernanda Raybaudi — UCAB (2022) · Chacao", phones: ["+584241990916"] },
  { name: "María Gabriela Gutiérrez — UCLA (2007) · Caracas", phones: ["04122467788"] },
  { name: "Maria Laura Isea — Unimet (2026) · Terrazas del Club Hípico", phones: ["04129960846"] },
  { name: "Miguel Liendo — UCAB (2017) · Las Acacias", phones: ["04123014208"] },
  { name: "Pablo Gonzalez — UCAB (2023) · El Paraíso", phones: ["04142043380"] },
  { name: "Pedro Tineo — UCV (2022) · Chacao/Miranda", phones: ["04126121942"] },
  { name: "Rafael Alcalá — IUT RC-UJMV (2006/2012) · Los Teques", phones: ["04142163347"] },
  { name: "Rafael Fermín — Unimet (2025) · La Tahona", phones: ["04123120570"] },
  { name: "Ricardo Algernon — UCAB (1980) · Terrazas Club Hípico", phones: ["04241739220"] },
  { name: "Romer Marciales — IUP Santiago Mariño (2012) · Caracas", phones: ["04264758571"] },
  { name: "Rubén Rincón — UNET (2019) · San Cristóbal, Táchira", phones: ["+584247846216"] },
  { name: "Samira Yebaile — Unimet (1999) · Prados del Este/Santa Fe", phones: ["04149175436"] },
  { name: "Sandra Alvarez — Unimet (2012) · El Hatillo", phones: ["04241456675"] },
  { name: "Sandra Palacios — USM (1996) · La California Sur", phones: ["04241342750"] },
  { name: "Santiago Pereira — UCAB (2026) · Colinas de Bello Monte", phones: ["04143156994"] },
  { name: "Sebastián Cova — UCV (2025) · Caricuao", phones: ["04245132309"] },
  { name: "Sebastián Olalquiaga — Unimet (2023) · Chacao", phones: ["04146212573"] },
  { name: "Shaiel Centeno — Unimet (2024) · Lechería, Anzoátegui", phones: ["04248065170"] },
  { name: "Stephanie Dávila — Unimet (2025) · Terrazas del Ávila", phones: ["04125533104"] },
  { name: "Ulises Linares — UCAB (2024) · El Paraíso", phones: ["04243671607"] },
  { name: "Vanessa Sosa — UCAB Guayana (2011) · Los Naranjos", phones: ["04249071110"] },
  { name: "Veralucia Lemus — UCAB (2024) · Los Ruices", phones: ["04241439325"] },
  { name: "Víctor Santana — Unimet (2026) · Terrazas del Ávila", phones: ["04241614659"] },
  { name: "Victoria Romero — Unimet (2025) · Los Chaguaramos", phones: ["04241650588"] },
  { name: "Wilneydi Medina — UCAB (2024) · Antimano", phones: ["04242515624"] },
] as const;

type Section = (typeof NAV)[number]["id"];

export function Dashboard({ canModerate }: { canModerate: boolean }) {
  const { reports, moderate, submit, verify } = useReports();
  const externalPets = useExternalPets();
  const connectedUsers = usePresence();
  const { theme, toggleTheme } = useTheme();
  const { t, catLabel } = useLanguage();
  const [section, setSection] = useState<Section>("resumen");
  const { volunteers: externalVolunteers, loading: loadingVolunteers } = useExternalVolunteers(section === "voluntariado");
  const [showReport, setShowReport] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Texto humano para acompañar la imagen/enlace (incluye el link porque en un
  // estado o historia el enlace no es clicable: tiene que estar escrito).
  function shareCaption() {
    return (
      "🇻🇪 Ayudémonos entre todos.\n\n" +
      "Después de los terremotos, cada reporte cuenta: alguien buscando a su familia, " +
      "un refugio con cupo, un hospital que necesita insumos, agua o comida.\n\n" +
      "Si viste algo, repórtalo. Si necesitas ayuda, búscala en el mapa.\n\n" +
      "Reportar puede salvar una vida. Compartir, también 🙏\n" +
      `👉 ${APP_URL}`
    );
  }

  // Compartir el ENLACE (clicable, ideal para mandar a una persona o grupo).
  async function shareLink() {
    setShareOpen(false);
    const url = APP_URL;
    const text =
      "🇻🇪 Ayudémonos entre todos. Mapa ciudadano para reportar y encontrar ayuda tras los terremotos: personas, refugios, hospitales, agua y comida. Reportar puede salvar una vida 🙏";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Centro de Coordinación Ciudadana", text, url });
        return;
      } catch {
        /* el usuario canceló */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
  }

  // Compartir la IMAGEN para estado de WhatsApp / historia de Instagram.
  // Importante: la web NO puede abrir el estado/historia directamente; se abre
  // el menú del teléfono y el usuario elige WhatsApp/Instagram → Estado/Historia.
  // Copiamos el texto al portapapeles porque Instagram no recibe el caption.
  async function shareToStatus() {
    setShareOpen(false);
    const caption = shareCaption();
    try {
      await navigator.clipboard?.writeText(caption);
    } catch {
      /* sin portapapeles */
    }
    try {
      const res = await fetch("/compartir.jpg");
      if (!res.ok) throw new Error("sin imagen");
      const blob = await res.blob();
      const file = new File([blob], "centro-coordinacion.jpg", { type: blob.type || "image/jpeg" });
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        return;
      }
      // PC o navegador sin compartir-archivos: abrir la imagen para descargarla.
      window.open("/compartir.jpg", "_blank", "noopener");
      alert(
        "Los estados/historias se publican desde el celular. Te abrí la imagen para guardarla y copiamos el texto. En tu teléfono: abre la app y toca Compartir → Estado/Historia."
      );
    } catch {
      shareLink();
    }
  }

  const pending = useMemo(() => reports.filter((r) => r.status === "sin_verificar"), [reports]);
  const allReports = useMemo(() => [...reports, ...externalPets], [reports, externalPets]);
  const selectedReport = selected ? allReports.find((r) => r.id === selected.id) ?? selected : null;

  const [reportFilter, setReportFilterRaw] = useState("todos");
  const [reportPage, setReportPage] = useState(1);
  const [reportSearch, setReportSearch] = useState("");
  const REPORTS_PER_PAGE = 20;
  const setReportFilter = (v: string) => {
    setReportFilterRaw(v);
    setReportPage(1);
  };
  const filteredReports = useMemo(() => {
    const def = MAP_FILTERS.find((f) => f.id === reportFilter);
    const byType = !def || def.types === "todos" ? allReports : allReports.filter((r) => (def.types as ReportType[]).includes(r.type));
    return byType.toSorted((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allReports, reportFilter]);
  const searchedReports = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    if (!q) return filteredReports;
    return filteredReports.filter((r) => {
      const haystack = [r.place, r.description, r.reporter_name, catLabel(r.type), ...Object.values(r.details ?? {})]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filteredReports, reportSearch, catLabel]);
  const recentReports = useMemo(
    () => reports.toSorted((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8),
    [reports]
  );
  const reportPageCount = Math.max(1, Math.ceil(searchedReports.length / REPORTS_PER_PAGE));
  const pagedReports = searchedReports.slice((reportPage - 1) * REPORTS_PER_PAGE, reportPage * REPORTS_PER_PAGE);

  const statCards = useMemo(() => {
    const byStatus = (s: string) => reports.filter((r) => r.status === s).length;
    return [
      { icon: "📋", label: "Total reportes", value: reports.length },
      { icon: "🆘", label: "Sin verificar", value: byStatus("sin_verificar") },
      { icon: "🔄", label: "En proceso", value: byStatus("en_proceso") },
      { icon: "✓", label: "Verificados", value: byStatus("verificado") },
      { icon: "⚑", label: "Falsos", value: byStatus("falso") },
    ];
  }, [reports]);

  // Las acciones de moderar (verificar/marcar falso/eliminar) solo existen en /admin.
  // En la página pública, un reporte se "marca" con confirm/attended/incorrect (verify),
  // que es la verificación ciudadana, no una acción de moderador.
  function rowActions(r: Report) {
    if (r.external) return {};
    return canModerate
      ? {
          onVerify: () => moderate(r, "verify"),
          onFalse: () => moderate(r, "false"),
          onDelete: () => moderate(r, "delete"),
        }
      : {};
  }

  const detailActions =
    selectedReport && !selectedReport.external
      ? canModerate
        ? {
            onVerify: () => moderate(selectedReport, "verify"),
            onFalse: () => moderate(selectedReport, "false"),
          }
        : {
            onVerify: () => verify(selectedReport, "confirm"),
            onFalse: () => verify(selectedReport, "incorrect"),
            onAttended: () => verify(selectedReport, "attended"),
          }
      : {};

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-3.5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-base md:hidden"
            style={{ borderColor: "var(--border)" }}
          >
            ☰
          </button>
          <VenezuelaFlag />
          <div className="truncate text-sm font-extrabold">Centro de Coordinación</div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden text-xs font-bold sm:inline" style={{ color: "var(--muted)" }}>{connectedUsers} conectado(s)</span>
          <span
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold sm:hidden"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            ● {connectedUsers}
          </span>
          <button type="button"
            onClick={() => setShowReport(true)}
            className="hidden h-9 items-center rounded-lg px-3.5 text-xs font-extrabold text-white sm:flex"
            style={{ background: "var(--accent)" }}
          >
            + Reportar
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShareOpen((o) => !o)}
              aria-label="Compartir"
              title="Compartir"
              className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-white"
              style={{ background: "#16a34a" }}
            >
              🔗 <span className="hidden sm:inline">Compartir</span>
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
                <div
                  className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl border shadow-lg"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <button
                    type="button"
                    onClick={shareToStatus}
                    className="flex w-full flex-col items-start gap-0.5 px-3.5 py-3 text-left text-sm font-bold"
                    style={{ borderBottom: "1px solid var(--border-2)" }}
                  >
                    🟢 Subir a estado de WhatsApp
                    <span className="text-[11px] font-normal" style={{ color: "var(--muted)" }}>
                      A un amigo o grupos
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={shareToStatus}
                    className="flex w-full flex-col items-start gap-0.5 px-3.5 py-3 text-left text-sm font-bold"
                    style={{ borderBottom: "1px solid var(--border-2)" }}
                  >
                    📸 Subir a historia de Instagram
                    <span className="text-[11px] font-normal" style={{ color: "var(--muted)" }}>
                      A un amigo o grupos
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={shareLink}
                    className="flex w-full flex-col items-start gap-0.5 px-3.5 py-3 text-left text-sm font-bold"
                  >
                    🔗 Compartir enlace
                    <span className="text-[11px] font-normal" style={{ color: "var(--muted)" }}>
                      Para mandar a alguien o a un grupo
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={toggleTheme} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: "var(--border)" }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <LanguageSwitcher />
        </div>
      </header>

      <nav
        className="sticky top-[57px] z-20 flex gap-2 overflow-x-auto px-3 py-2 md:hidden"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        {NAV.map((n) => (
          <button type="button"
            key={n.id}
            onClick={() => setSection(n.id)}
            className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold whitespace-nowrap"
            style={{
              background: section === n.id ? "var(--accent)" : "var(--surface-2)",
              color: section === n.id ? "#fff" : "var(--fg-2)",
            }}
          >
            <span>{n.icon}</span>
            {t(`nav.${n.id}`)}
            {n.id === "reportes" && pending.length > 0 && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px]"
                style={{ background: section === n.id ? "rgba(255,255,255,.25)" : "var(--accent)", color: "#fff" }}
              >
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex flex-1">
        <aside
          className="hidden w-56 flex-shrink-0 flex-col gap-1 p-4 md:flex"
          style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}
        >
          <NavList section={section} pending={pending.length} onSelect={setSection} />
        </aside>

        {navOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" aria-modal>
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{ background: "rgba(0,0,0,.4)" }}
              onClick={() => setNavOpen(false)}
            />
            <div
              className="relative flex h-full w-64 flex-col gap-1 p-4"
              style={{ background: "var(--surface)" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-extrabold">Menú</span>
                <button type="button" onClick={() => setNavOpen(false)} aria-label="Cerrar menú" className="text-xl">×</button>
              </div>
              <NavList
                section={section}
                pending={pending.length}
                onSelect={(id) => {
                  setSection(id);
                  setNavOpen(false);
                }}
              />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6">
          {section === "resumen" && (
            <div className="flex flex-col gap-5">
              <div
                className="flex flex-col items-start gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
              >
                <div>
                  <div className="font-extrabold">¿Viste algo que reportar?</div>
                  <div className="text-sm" style={{ color: "var(--fg-2)" }}>
                    Es anónimo, no necesitas cuenta, y toma menos de 1 minuto.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReport(true)}
                  className="h-11 flex-shrink-0 rounded-xl px-5 text-sm font-extrabold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  + Reportar ahora
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
                {statCards.map((s) => (
                  <div key={s.label} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="mb-2 text-lg">{s.icon}</div>
                    <div className="text-2xl font-extrabold">{s.value}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <FilterChips value={reportFilter} onChange={setReportFilter} />
                  <div
                    className="relative isolate overflow-hidden rounded-2xl border"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", minHeight: 420 }}
                  >
                    {/* No montar este mapa mientras el mapa completo está abierto: evita
                        que dos instancias de Leaflet/MarkerClusterGroup agrupen los mismos
                        ~1900 reportes al mismo tiempo y congelen la pestaña. */}
                    {!showFullMap && (
                      <ReportMap
                        reports={filteredReports}
                        theme={theme}
                        base="streets"
                        center={[8, -66]}
                        zoom={6}
                        flyTarget={null}
                        onSelect={setSelected}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowFullMap(true)}
                      className="absolute right-3 top-3 z-[1000] flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-md"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
                    >
                      ⛶ Ver mapa completo
                    </button>
                  </div>
                  <NationalEmergencyBlock />
                </div>
                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="px-4 py-3 text-sm font-extrabold" style={{ borderBottom: "1px solid var(--border)" }}>
                    Reportes recientes
                  </div>
                  <div className="flex flex-col gap-2.5 p-3">
                    {recentReports.map((r) => (
                      <ReportRow key={r.id} report={r} onClick={() => setSelected(r)} {...rowActions(r)} />
                    ))}
                  </div>
                  {reports.length === 0 && (
                    <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>Sin reportes todavía.</div>
                  )}
                </div>
              </div>

              <SeismicActivity />
            </div>
          )}

          {section === "reportes" && (
            <div className="flex flex-col gap-3">
              <FilterChips value={reportFilter} onChange={setReportFilter} />
              {(FILTER_DISCLAIMERS[reportFilter] || reportFilter === "personas") && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  {FILTER_DISCLAIMERS[reportFilter] && (
                    <div
                      className="flex-1 rounded-xl px-3.5 py-2.5 text-xs font-bold leading-relaxed"
                      style={{ background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", color: "#7c3aed" }}
                    >
                      {FILTER_DISCLAIMERS[reportFilter]}
                    </div>
                  )}
                  {reportFilter === "personas" && <LocalizaPacientesCard />}
                </div>
              )}
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => {
                  setReportSearch(e.target.value);
                  setReportPage(1);
                }}
                aria-label="Buscar reportes por nombre, cédula, lugar o descripción"
                placeholder="Buscar por nombre, cédula, lugar o descripción..."
                className="h-10 w-full rounded-xl border px-3.5 text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              />
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-extrabold">Todos los reportes</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{searchedReports.length} en total</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {pagedReports.map((r) => (
                  <ReportRow key={r.id} report={r} onClick={() => setSelected(r)} {...rowActions(r)} />
                ))}
              </div>
              {searchedReports.length > 0 && reportPageCount > 1 && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                    disabled={reportPage <= 1}
                    className="h-9 rounded-lg border px-3.5 text-sm font-bold disabled:opacity-40"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    Página {reportPage} de {reportPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReportPage((p) => Math.min(reportPageCount, p + 1))}
                    disabled={reportPage >= reportPageCount}
                    className="h-9 rounded-lg border px-3.5 text-sm font-bold disabled:opacity-40"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
              {searchedReports.length === 0 && (
                <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>Sin reportes para este filtro.</div>
              )}
            </div>
          )}

          {section === "moderacion" && (
            <a
              href="mailto:Centrocooperativovenezuela@gmail.com?subject=Reporte%20de%20error%20o%20contacto%20con%20moderaci%C3%B3n"
              className="flex items-center gap-3 rounded-2xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <span className="text-2xl">✉️</span>
              <span className="flex-1">
                <span className="block text-sm font-extrabold">¿Encontraste un error o necesitás contactar a un moderador?</span>
                <span className="block text-xs" style={{ color: "var(--muted)" }}>
                  Escribinos a Centrocooperativovenezuela@gmail.com
                </span>
              </span>
              <span
                className="inline-flex h-9 flex-shrink-0 items-center rounded-lg px-3.5 text-xs font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                Enviar correo
              </span>
            </a>
          )}

          {section === "mapa" && (
            <div className="flex flex-col gap-3">
              <FilterChips value={reportFilter} onChange={setReportFilter} />
              <div
                className="relative isolate overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--border)", background: "var(--surface)", height: "calc(100vh - 210px)" }}
              >
                {!showFullMap && (
                  <ReportMap
                    reports={filteredReports}
                    theme={theme}
                    base="streets"
                    center={[8, -66]}
                    zoom={6}
                    flyTarget={null}
                    onSelect={(r) => setSelected(r)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowFullMap(true)}
                  className="absolute right-3 top-3 z-[1000] flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-md"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--fg)" }}
                >
                  ⛶ Pantalla completa
                </button>
              </div>
            </div>
          )}

          {section === "grupos" && <LinkCardGrid items={COMM_GROUPS} />}

          {section === "encuentro_seguro" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Para casos de niños, niñas o adolescentes separados de su familia tras el terremoto.
                Esta plataforma opera bajo el marco de la LOPNNA y requiere verificación presencial
                para cualquier reencuentro — no es un listado público de menores.
              </p>
              <LinkCardGrid items={ENCUENTRO_SEGURO_LINKS} />
            </div>
          )}

          {section === "donaciones" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Plataformas para donar desde fuera de Venezuela, recomendadas por voluntarios en redes.
              </p>
              <LinkCardGrid items={DONATION_LINKS} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                ¿Buscas dónde llevar insumos en físico? Los centros de acopio aparecen como reportes en el{" "}
                <button type="button" className="font-bold underline" onClick={() => setSection("mapa")}>
                  mapa operativo
                </button>
                .
              </p>

              <h2 className="mt-2 text-lg font-extrabold">🐾 Mascotas</h2>
              <div className="flex flex-col gap-3">
                {PET_RESOURCES.map((p) => (
                  <div key={p.name} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm" style={{ color: "var(--fg-2)" }}>{p.desc}</div>
                    <div className="mt-1 text-xs font-bold" style={{ color: "var(--muted)" }}>{p.contact}</div>
                  </div>
                ))}
              </div>

              <h2 className="mt-2 text-lg font-extrabold">✈️ Acopio para mascotas desde el exterior</h2>
              <div className="flex flex-col gap-3">
                {DIASPORA_PET_DROPOFFS.map((p) => (
                  <div key={p.name} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm" style={{ color: "var(--fg-2)" }}>{p.desc}</div>
                    <div className="mt-1 text-xs font-bold" style={{ color: "var(--muted)" }}>{p.address}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "telefonos" && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Directorio de hospitales y líneas de emergencia. Fuente:{" "}
                <a href="https://redayudavenezuela.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">
                  redayudavenezuela.com
                </a>
              </p>
              <PhoneGroup title="🏥 Hospitales en Caracas" entries={HOSPITALS_CARACAS} />
              <PhoneGroup title="🚨 Emergencias (línea directa)" entries={EMERGENCY_LINES} />
              <PhoneGroup title="🚑 Ambulancias" entries={AMBULANCES} />
              <PhoneGroup title="🚒 Bomberos" entries={FIREFIGHTERS} />
            </div>
          )}

          {section === "voluntariado" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Organizaciones que reciben voluntarios para la respuesta al terremoto. Fuente:{" "}
                <span className="font-bold">redayudavenezuela.com</span>.
              </p>
              {VOLUNTEER_ORGS.map((o) => (
                <div key={o.name} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="font-bold">{o.name}</div>
                  <div className="text-sm" style={{ color: "var(--fg-2)" }}>{o.desc}</div>
                  <div className="mt-1 text-xs font-bold" style={{ color: "var(--muted)" }}>{o.contact}</div>
                </div>
              ))}

              <h2 className="mt-2 text-lg font-extrabold">🙋 Voluntarios individuales (en vivo)</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Personas que se ofrecieron directamente en redayudavenezuela.com. Esta lista se lee en vivo desde su
                plataforma — si alguien deja de estar disponible allá, desaparece de aquí también.
              </p>
              {loadingVolunteers && (
                <div className="rounded-2xl border p-4 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  Cargando…
                </div>
              )}
              {!loadingVolunteers && externalVolunteers.length === 0 && (
                <div className="rounded-2xl border p-4 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  No se pudo cargar la lista en este momento.
                </div>
              )}
              {externalVolunteers
                .filter((v) => v.contact && v.contact.trim().length > 0)
                .map((v) => (
                  <div key={v.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <div className="font-bold">{v.title}</div>
                    <div className="text-sm" style={{ color: "var(--fg-2)" }}>{v.description}</div>
                    <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-bold" style={{ color: "var(--muted)" }}>
                      {[v.city, v.state].filter(Boolean).join(", ") || "Ubicación no especificada"} · {v.contact}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {section === "ingenieros" && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Ingenieros civiles voluntarios para consultas estructurales gratis (remotas y presenciales) tras el
                terremoto del 24/6. Fuente: <span className="font-bold">@fceunimet</span> (Instagram).
              </p>
              <PhoneGroup title="🏗️ Ingenieros estructurales voluntarios" entries={STRUCTURAL_ENGINEERS} />
            </div>
          )}

          {section === "tutorial" && <Tutorial />}
        </main>
      </div>

      <button type="button"
        onClick={() => setShowReport(true)}
        className="fixed bottom-5 right-4 z-30 flex h-12 items-center gap-2 rounded-full px-5 text-sm font-extrabold text-white shadow-lg sm:hidden"
        style={{ background: "var(--accent)" }}
      >
        + Reportar
      </button>

      {showReport && (
        <ReportForm
          onClose={() => setShowReport(false)}
          onSubmit={(draft) => submit(draft, false)}
        />
      )}

      {selectedReport && (
        <ReportDetailPanel
          report={selectedReport}
          onClose={() => setSelected(null)}
          moderator={canModerate}
          onResolved={selectedReport.external ? undefined : () => verify(selectedReport, "resolved")}
          {...detailActions}
        />
      )}

      {showFullMap && <CitizenMapView onClose={() => setShowFullMap(false)} />}
    </div>
  );
}

function NavList({
  section,
  pending,
  onSelect,
}: {
  section: Section;
  pending: number;
  onSelect: (id: Section) => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      {NAV.map((n) => (
        <button type="button"
          key={n.id}
          onClick={() => onSelect(n.id)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-bold"
          style={{
            background: section === n.id ? "var(--accent-soft)" : "transparent",
            color: section === n.id ? "var(--accent)" : "var(--fg-2)",
          }}
        >
          <span className="w-5 text-center">{n.icon}</span>
          {t(`nav.${n.id}`)}
          {n.id === "reportes" && pending > 0 && (
            <span className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] text-white" style={{ background: "var(--accent)" }}>
              {pending}
            </span>
          )}
        </button>
      ))}
    </>
  );
}

const LOCALIZA_PACIENTES_URL = "https://localizapacientes.com";

function LocalizaPacientesCard() {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(LOCALIZA_PACIENTES_URL)}`;
  return (
    <a
      href={LOCALIZA_PACIENTES_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-shrink-0 items-center gap-3 rounded-xl border p-3 sm:w-72"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="" width={64} height={64} className="flex-shrink-0 rounded-lg" style={{ background: "#fff" }} />
      <div>
        <div className="text-xs font-extrabold" style={{ color: "var(--fg)" }}>
          Centro Nacional de Localización de Personas
        </div>
        <div className="mt-0.5 text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
          Listas actualizadas · localizapacientes.com
        </div>
      </div>
    </a>
  );
}

function NationalEmergencyBlock() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div>
        <div className="text-sm font-extrabold" style={{ color: "var(--fg)" }}>🚨 Emergencias nacionales</div>
        <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--muted)" }}>
          Si hay una persona en peligro ahora, llama. Toca el número para marcar.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {NATIONAL_EMERGENCY_NUMBERS.map((n) => (
          <a
            key={n.number}
            href={telLink(n.number)}
            className={`flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center font-extrabold ${
              n.tone === "primary" ? "text-white" : ""
            }`}
            style={
              n.tone === "primary"
                ? { background: "#dc2626" }
                : { background: "var(--surface-2)", color: "var(--fg)" }
            }
          >
            <span className="text-lg">{n.number}</span>
            <span className="text-[11px] font-bold leading-tight">{n.label}</span>
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold leading-tight" style={{ color: "var(--fg)" }}>
              {PROTECCION_CIVIL_REPORTE.title}
            </span>
            <span
              className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              OFICIAL
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--muted)" }}>
            {PROTECCION_CIVIL_REPORTE.desc}
          </p>
        </div>
        <a
          href={telLink(PROTECCION_CIVIL_REPORTE.phone)}
          className="flex-shrink-0 rounded-lg px-3 py-2 text-center text-xs font-extrabold text-white"
          style={{ background: "#dc2626" }}
        >
          {PROTECCION_CIVIL_REPORTE.phone}
        </a>
      </div>
    </div>
  );
}

function FilterChips({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { mapFilterLabel } = useLanguage();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
      {MAP_FILTERS.map((f) => (
        <button
          type="button"
          key={f.id}
          onClick={() => onChange(f.id)}
          className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold"
          style={{
            background: value === f.id ? "var(--accent)" : "var(--surface)",
            color: value === f.id ? "#fff" : "var(--fg)",
            borderColor: value === f.id ? "var(--accent)" : "var(--border)",
          }}
        >
          <span>{f.emoji}</span>
          {mapFilterLabel(f.id)}
        </button>
      ))}
    </div>
  );
}

function PhoneGroup({
  title,
  entries,
}: {
  title: string;
  entries: readonly { name: string; phones: readonly string[] }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="px-4 py-3 text-sm font-extrabold" style={{ borderBottom: "1px solid var(--border)" }}>
        {title}
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        {entries.map((e) => (
          <div key={e.name} className="rounded-xl border p-3.5" style={{ borderColor: "var(--border-2)" }}>
            <div className="mb-2 text-base font-bold">{e.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {e.phones.map((p) => (
                <a
                  key={p}
                  href={telLink(p)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  📞 {p}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkCardGrid({
  items,
}: {
  items: readonly { id: string; name: string; icon: string; desc: string; url: string; cta: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-3 rounded-2xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-base font-extrabold">{item.name}</span>
          </div>
          <p className="text-sm" style={{ color: "var(--fg-2)" }}>{item.desc}</p>
          <span
            className="mt-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            {item.cta}
          </span>
        </a>
      ))}
    </div>
  );
}

const TUTORIAL_STEPS = [
  {
    img: "/tutorial/01-resumen.png",
    title: "1. Mira el resumen",
    text: "Al entrar ves cuántos reportes hay, cuáles faltan por confirmar, y los más recientes. Es lo primero que ve cualquier persona.",
  },
  {
    img: "/tutorial/02-mapa.png",
    title: "2. Mira el mapa",
    text: "Toca \"Mapa operativo\" para ver todos los reportes ubicados en Venezuela. Cada color es un tipo distinto de reporte. Puedes filtrar por categoría arriba.",
  },
  {
    img: "/tutorial/03-elegir-tipo.png",
    title: "3. Toca \"+ Reportar\"",
    text: "Elige qué quieres reportar: una persona atrapada o desaparecida, un refugio, un hospital que necesita insumos, una mascota perdida, etc.",
  },
  {
    img: "/tutorial/05-referencia.png",
    title: "4. Di dónde fue",
    text: "Tienes 3 opciones: usar tu ubicación GPS, escribir la dirección exacta, o si no la sabes, escribir una referencia (\"cerca de la plaza\") y marcar el lugar en un mapita.",
  },
  {
    img: "/tutorial/06-detalles.png",
    title: "5. Cuéntanos qué pasó",
    text: "Completa los datos que te pide (cambian según el tipo de reporte) y agrega una foto si tienes una. Todo lo que no sepas, puedes dejarlo en blanco.",
  },
  {
    img: "/tutorial/07-revisar.png",
    title: "6. Revisa y envía",
    text: "Confirma que todo esté bien y presiona \"Enviar reporte\". Listo — ya aparece en el mapa para que todos lo vean al instante.",
  },
  {
    img: "/tutorial/08-verificar.png",
    title: "7. Ayuda confirmando reportes",
    text: "Toca cualquier reporte para ver sus detalles. Si sabes que es cierto, presiona \"Verificado\". Si ya fue atendido, \"Marcar atendido\". Si crees que es falso, \"Falso\". Cuando la situación ya se resolvió, presiona \"Ya está resuelto\" — cuando 8 personas confirman esto, el reporte se puede quitar del mapa.",
  },
] as const;

function Tutorial() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="mb-2 text-lg font-extrabold">¿Qué es esta plataforma?</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
          Es un mapa hecho por ciudadanos para ayudar después de los terremotos en Venezuela. Cualquier
          persona puede reportar y ver, en tiempo real: gente atrapada o desaparecida, vías bloqueadas,
          hospitales y refugios, centros de acopio, y mascotas perdidas. No necesitas crear una cuenta ni
          dar tus datos para usarla.
        </p>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="mb-2 text-lg font-extrabold">¿Para qué sirve?</h2>
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
          <li>🆘 Pedir ayuda si tú o alguien cerca está en peligro</li>
          <li>🟢 Avisar si encontraste a una persona o una mascota</li>
          <li>💧 Decir dónde hay agua, comida, medicinas o un refugio</li>
          <li>✓ Confirmar reportes de otras personas para que sean más confiables</li>
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-extrabold">Cómo funciona, paso a paso</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TUTORIAL_STEPS.map((s) => (
            <div key={s.title} className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <Image src={s.img} alt={s.title} width={390} height={844} className="w-full" style={{ height: "auto" }} />
              <div className="p-4">
                <div className="mb-1.5 font-extrabold">{s.title}</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <h2 className="mb-2 text-lg font-extrabold">Consejos</h2>
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
          <li>No necesitas crear cuenta ni iniciar sesión para reportar.</li>
          <li>Puedes reportar sin dar tu nombre. Si dejas un teléfono, otros podrán contactarte por esa vía.</li>
          <li>Si no tienes internet en el momento, activa &quot;Modo offline&quot; antes de reportar — se enviará apenas vuelva la señal.</li>
        </ul>
      </div>
    </div>
  );
}

function VenezuelaFlag() {
  // Estrellas en arco (8 estrellas blancas sobre la franja azul)
  const stars = Array.from({ length: 8 }, (_, i) => {
    const angle = Math.PI + (i / 7) * Math.PI; // arco inferior
    const cx = 11 + Math.cos(angle) * 6;
    const cy = 9.5 + Math.sin(angle) * 2.6;
    return <circle key={i} cx={cx} cy={cy} r={0.7} fill="#fff" />;
  });
  return (
    <svg
      width="22"
      height="16"
      viewBox="0 0 22 16"
      role="img"
      aria-label="Bandera de Venezuela"
      className="flex-shrink-0 rounded-[3px]"
      style={{ boxShadow: "0 0 0 1px var(--border)" }}
    >
      <rect width="22" height="16" rx="2" fill="#fff" />
      <clipPath id="vflag">
        <rect width="22" height="16" rx="2" />
      </clipPath>
      <g clipPath="url(#vflag)">
        <rect width="22" height="5.34" y="0" fill="#FCDD09" />
        <rect width="22" height="5.34" y="5.33" fill="#003893" />
        <rect width="22" height="5.34" y="10.66" fill="#CF142B" />
        {stars}
      </g>
    </svg>
  );
}
