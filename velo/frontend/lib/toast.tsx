"use client";
import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error";
interface Toast { id: number; message: string; type: ToastType }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void }

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto font-body text-sm px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
              t.type === "success"
                ? "bg-white border-emerald-200 text-emerald-800"
                : "bg-white border-red-200 text-red-700"
            }`}
          >
            {t.type === "success" ? "✓ " : "✕ "}{t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
