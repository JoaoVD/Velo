"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bone">
      <div className="w-full max-w-sm bg-white border border-ink/10 p-8 rounded-xl">
        <h1 className="font-display font-bold text-2xl text-ink mb-1">
          Vel<span className="text-signal">o</span>
        </h1>
        <p className="font-mono text-xs text-ink/40 mb-6">Monitore sua presença nas IAs.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-mono text-xs font-medium text-ink/60 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-bone"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-xs font-medium text-ink/60 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/20 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-signal bg-bone"
              required
            />
          </div>
          {error && <p className="font-mono text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            className="w-full bg-signal text-white py-2 rounded-lg font-mono text-sm font-medium hover:bg-signal/90 transition-colors"
          >
            Entrar
          </button>
        </form>
        <p className="mt-4 font-mono text-xs text-center text-ink/40">
          Não tem conta?{" "}
          <a href="/auth/signup" className="text-signal hover:underline">Criar conta</a>
        </p>
      </div>
    </div>
  );
}
