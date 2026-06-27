import type { Metadata } from "next";
import { Manrope, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://centro-ayuda-venezuela.vercel.app";
const TITLE = "Centro de Coordinación Ciudadana";
const DESCRIPTION =
  "Mapa en vivo para reportar y encontrar ayuda tras los sismos en Venezuela: personas, refugios, hospitales, agua, alimentos y centros de acopio. Gratis.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: SITE_URL,
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/icon.png", width: 512, height: 512, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark" className={`${manrope.variable} ${dmMono.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-manrope)" }}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
