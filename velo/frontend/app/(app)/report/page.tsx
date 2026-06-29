import { createClient as createServerClient } from "@/lib/supabase-server";
import { apiFetch } from "@/lib/api";
import { ReportViewer } from "@/components/ReportViewer";
import { Report } from "@/lib/types";

export default async function ReportPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  const brands = await apiFetch<{ id: string }[]>("/brands", token).catch(() => []);
  const brandId = brands[0]?.id;

  if (!brandId) {
    return <div className="font-mono text-sm text-ink/50">Nenhuma marca cadastrada.</div>;
  }

  let report: Report | null = null;
  try {
    report = await apiFetch<Report>(`/brands/${brandId}/reports/latest`, token);
  } catch {
    report = null;
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-ink">Relatório Semanal</h1>
      {report ? (
        <>
          <p className="font-mono text-sm text-ink/50 mt-1">
            Período: {report.period_start} — {report.period_end}
          </p>
          <div className="mt-6 bg-white rounded-xl border border-ink/10 p-6">
            <ReportViewer markdown={report.content_md} />
          </div>
        </>
      ) : (
        <p className="mt-4 font-mono text-sm text-ink/40">Nenhum relatório disponível ainda.</p>
      )}
    </div>
  );
}
