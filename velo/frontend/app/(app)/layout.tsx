"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Clock,
  FileText,
  Target,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/keywords",    label: "Keywords",     icon: Tag },
  { href: "/history",     label: "Histórico",    icon: Clock },
  { href: "/report",      label: "Relatório",    icon: FileText },
  { href: "/action-plan", label: "Plano de Ação", icon: Target },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0.5 shrink-0 mr-6">
            <span className="font-display font-black text-xl text-slate-900 leading-none">
              Velo
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-moss-600 mb-0.5 ml-0.5" />
          </Link>

          {/* Nav items */}
          <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 font-mono text-xs px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? "bg-moss-50 text-moss-600 font-semibold"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={13} className="shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-1.5 font-mono text-xs px-3 py-2 rounded-lg transition-colors shrink-0 ${
              pathname === "/settings"
                ? "bg-moss-50 text-moss-600 font-semibold"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Settings size={13} />
            Configurações
          </Link>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
