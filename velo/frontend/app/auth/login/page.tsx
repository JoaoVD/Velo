"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1 justify-center">
            <span className="font-display font-black text-3xl text-slate-900 leading-none">Velo</span>
            <span className="w-2 h-2 rounded-full bg-moss-600 mb-0.5 ml-0.5" />
          </div>
          <p className="font-body text-xs text-slate-400 mt-2">Monitore sua presença nas IAs.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-[0_1px_2px_rgba(15,25,35,0.04),0_24px_56px_-24px_rgba(15,25,35,0.18)]">
          <h1 className="font-display font-black text-2xl text-slate-900 mb-1">Entrar</h1>
          <p className="font-body text-xs text-slate-400 mb-7">Acesse sua conta Velo.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-body text-xs font-medium text-slate-600 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-slate-600 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
                required
              />
            </div>

            {error && (
              <p className="font-body text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-moss-600 text-white py-3 rounded-full font-body text-sm font-semibold shadow-[0_8px_20px_-6px_rgba(63,107,78,0.4)] hover:bg-moss-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 font-body text-xs text-center text-slate-400">
          Não tem conta?{" "}
          <Link href="/auth/signup" className="text-moss-600 hover:underline font-medium">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
