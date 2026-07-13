import type { Metadata } from "next";
import { Fraunces, Manrope, Nunito } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/lib/toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "700", "900"],
});

// Títulos da landing (estilo Semrush)
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "700", "800"],
});

// Fonte do corpo do texto em todo o produto
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Velo — Monitore sua presença nas IAs em tempo real.",
  description:
    "A Velo monitora automaticamente como ChatGPT e Gemini descrevem sua marca, calcula um GEO Score (0–100) e entrega um plano de ação semanal em português.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${manrope.variable} ${nunito.variable} font-body bg-bone text-ink`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
