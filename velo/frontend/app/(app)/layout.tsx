"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  LayoutDashboard,
  Tag,
  Clock,
  FileText,
  Target,
  Settings,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { href: "/keywords",     label: "Keywords",      icon: Tag },
  { href: "/history",      label: "Histórico",     icon: Clock },
  { href: "/report",       label: "Relatório",     icon: FileText },
  { href: "/action-plan",  label: "Plano de Ação", icon: Target },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-slate-900 fixed left-0 top-0 bottom-0 z-30">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-0.5">
            <span className="font-display font-black text-xl text-white leading-none">Velo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-moss-200 mb-0.5 ml-0.5" />
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors ${
                  active
                    ? "bg-moss-600/20 text-moss-200 font-semibold border-l-2 border-moss-200 pl-[10px]"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-colors ${
              pathname === "/settings"
                ? "bg-moss-600/20 text-moss-200 font-semibold border-l-2 border-moss-200 pl-[10px]"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            }`}
          >
            <Settings size={14} className="shrink-0" />
            Configurações
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={14} className="shrink-0" />
            Sair
          </button>
          <div className="px-3 pt-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600 font-semibold bg-slate-800 px-2 py-1 rounded-full">
              Starter
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 h-12 flex items-center px-4 gap-3">
        <Link href="/" className="flex items-center gap-0.5 shrink-0">
          <span className="font-display font-black text-lg text-white leading-none">Velo</span>
          <span className="w-1.5 h-1.5 rounded-full bg-moss-200 mb-0.5 ml-0.5" />
        </Link>
        <nav className="flex gap-1 overflow-x-auto flex-1 scrollbar-hide">
          {[...NAV, { href: "/settings", label: "Config", icon: Settings }].map(
            ({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded font-mono text-[10px] whitespace-nowrap transition-colors ${
                    active ? "bg-moss-600/30 text-moss-200" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon size={11} />
                  {label}
                </Link>
              );
            }
          )}
        </nav>
      </div>

      {/* Page content */}
      <main className="flex-1 md:ml-56 px-6 py-8 md:py-10 mt-12 md:mt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
