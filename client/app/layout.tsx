import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EasyDraft",
  description:
    "Il tuo compagno ideale per simulare la fase di draft in League of Legends! Con la nostra piattaforma user-friendly, puoi sperimentare la strategia di selezione dei campioni come mai prima d'ora. Costruisci la tua squadra da sogno, esplora sinergie vincenti e affina le tue abilità di drafting. Con una vasta gamma di campioni, aggiornamenti in tempo reale e analisi approfondite, EasyDraft ti offre un'esperienza coinvolgente per affinare le tue abilità di draft e prepararti per il successo nel campo di gioco di League of Legends. Sii il maestro della selezione dei campioni - inizia a simulare ora su EasyDraft",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
