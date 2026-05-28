import type { Metadata } from "next";
import { Montserrat, DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import SmartsuppChat from "@/components/SmartsuppChat";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SafeTrip | Votre Marketplace de Voyage Routier",
  description: "Réservez vos billets de bus et tracez vos colis en toute sécurité avec SafeTrip.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${syne.variable} ${montserrat.variable}`}>
        {children}
        <SmartsuppChat />
      </body>
    </html>
  );
}
