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
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fontFamily: "var(--font-body)", fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fontFamily: "var(--font-body)", fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        />
        <Legend
          wrapperStyle={{ fontFamily: "var(--font-body)", fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="chatgpt"
          name="ChatGPT"
          stroke="#3f6b4e"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="gemini"
          name="Gemini"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
