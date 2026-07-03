import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bone text-ink">
      <header className="border-b border-ink/10 bg-bone/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl leading-none">
            v<span className="text-signal">e</span>lo
          </Link>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/60 hover:text-ink transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">{children}</main>

      <footer className="border-t border-ink/10 mt-10">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-ink/50">© 2026 Velo · Feito no Brasil</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/legal/termos"
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/50 hover:text-ink transition-colors"
            >
              Termos de Uso
            </Link>
            <Link
              href="/legal/privacidade"
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/50 hover:text-ink transition-colors"
            >
              Privacidade
            </Link>
            <Link
              href="/legal/lgpd"
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink/50 hover:text-ink transition-colors"
            >
              LGPD
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
