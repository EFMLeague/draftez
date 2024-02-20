import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";
export const revalidate = 0;

const rajdhani = Rajdhani({
  weight: ["400", "600", "500", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});
const schabo = localFont({
  src: [
    {
      path: "./utils/font/SCHABO-Condensed.otf",
      weight: "400",
      style: "normal",
    },
  ],
});
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
    <html lang="it">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${schabo.className}`}>{children}</body>
    </html>
  );
}
