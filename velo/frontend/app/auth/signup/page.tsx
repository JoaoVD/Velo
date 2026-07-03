"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { Check } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { org_name: orgName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-moss-50 border border-moss-100 mb-6">
            <Check size={28} className="text-moss-600" />
          </div>
          <h2 className="font-display font-black text-2xl text-slate-900 mb-3">
            Verifique seu e-mail
          </h2>
          <p className="font-mono text-sm text-slate-500 leading-relaxed">
            Enviamos um link de confirmação para{" "}
            <strong className="text-slate-700">{email}</strong>.
            <br />Clique no link para ativar sua conta.
          </p>
        </div>
      </div>
    );
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
          <p className="font-mono text-xs text-slate-400 mt-2">7 dias grátis. Sem cartão de crédito.</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-100">
          <h1 className="font-display font-black text-2xl text-slate-900 mb-1">Criar conta</h1>
          <p className="font-mono text-xs text-slate-400 mb-7">
            Comece a monitorar sua presença nas IAs.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block font-mono text-xs font-medium text-slate-600 mb-1.5">
                Nome da empresa
              </label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Clínica São Lucas"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs font-medium text-slate-600 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs font-medium text-slate-600 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 8 caracteres"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-moss-600 focus:border-transparent bg-white transition-shadow"
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-moss-600 text-white py-3 rounded-xl font-mono text-sm font-semibold hover:bg-moss-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Criando conta..." : "Criar conta grátis"}
            </button>
          </form>

          <p className="font-mono text-[10px] text-slate-400 text-center mt-5">
            Ao criar uma conta você concorda com nossos{" "}
            <Link href="/legal/termos" className="underline">Termos</Link> e{" "}
            <Link href="/legal/privacidade" className="underline">Política de Privacidade</Link>.
          </p>
        </div>

        <p className="mt-6 font-mono text-xs text-center text-slate-400">
          Já tem conta?{" "}
          <Link href="/auth/login" className="text-moss-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
