import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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

export const metadata: Metadata = {
  title: "Velo — Monitore sua presença nas IAs em tempo real.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${ibmPlexMono.variable} font-mono bg-bone text-ink`}>
        <div className="min-h-screen">
          <nav className="bg-white border-b border-ink/10 px-6 py-3 flex items-center gap-6">
            <span className="font-display font-bold text-lg tracking-tight">
              Vel<span className="text-signal">o</span>
            </span>
            <Link href="/dashboard" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Dashboard</Link>
            <Link href="/keywords" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Keywords</Link>
            <Link href="/history" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Histórico</Link>
            <Link href="/report" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Relatório</Link>
            <Link href="/action-plan" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Plano de Ação</Link>
            <Link href="/settings" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors ml-auto">Configurações</Link>
          </nav>
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
