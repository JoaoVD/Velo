import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600"],
});

// Fontes da landing (estilo Semrush: Factor A ≈ Manrope, corpo = Inter)
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Velo — Monitore sua presença nas IAs em tempo real.",
  description:
    "A Velo monitora automaticamente como ChatGPT e Gemini descrevem sua marca, calcula um GEO Score (0–100) e entrega um plano de ação semanal em português.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${ibmPlexMono.variable} ${manrope.variable} ${inter.variable} font-mono bg-bone text-ink`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
