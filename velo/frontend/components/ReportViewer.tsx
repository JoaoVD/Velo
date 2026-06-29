"use client";
import ReactMarkdown from "react-markdown";

interface Props {
  markdown: string;
}

export function ReportViewer({ markdown }: Props) {
  return (
    <div className="prose prose-sm max-w-none font-mono text-ink">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
