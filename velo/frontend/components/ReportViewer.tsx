"use client";
import ReactMarkdown from "react-markdown";

interface Props {
  markdown: string;
}

export function ReportViewer({ markdown }: Props) {
  return (
    <div className="prose prose-sm max-w-none font-mono text-slate-700 prose-headings:font-display prose-headings:text-slate-900 prose-a:text-moss-600 prose-strong:text-slate-800">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
