"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Score } from "@/lib/types";

interface Props {
  scores: Score[];
}

export function ScoreHistoryChart({ scores }: Props) {
  const byDate: Record<string, { chatgpt: number[]; gemini: number[] }> = {};
  for (const s of scores) {
    if (!byDate[s.date]) byDate[s.date] = { chatgpt: [], gemini: [] };
    byDate[s.date][s.engine as "chatgpt" | "gemini"].push(s.geo_score);
  }

  const data = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      chatgpt: v.chatgpt.length
        ? +(v.chatgpt.reduce((a, b) => a + b) / v.chatgpt.length).toFixed(1)
        : undefined,
      gemini: v.gemini.length
        ? +(v.gemini.reduce((a, b) => a + b) / v.gemini.length).toFixed(1)
        : undefined,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0f192310" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="chatgpt" name="ChatGPT" stroke="#c8460a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="gemini" name="Gemini" stroke="#2d6a4f" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
