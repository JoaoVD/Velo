import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-ink/10 px-6 py-3 flex items-center gap-6">
        <Link href="/" className="font-display font-bold text-lg tracking-tight">
          Vel<span className="text-signal">o</span>
        </Link>
        <Link href="/dashboard" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Dashboard</Link>
        <Link href="/keywords" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Keywords</Link>
        <Link href="/history" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Histórico</Link>
        <Link href="/report" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Relatório</Link>
        <Link href="/action-plan" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors">Plano de Ação</Link>
        <Link href="/settings" className="font-mono text-sm text-ink/60 hover:text-ink transition-colors ml-auto">Configurações</Link>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
