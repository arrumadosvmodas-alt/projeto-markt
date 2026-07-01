import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "../ui";

export function SpendingChart({ series }: { series: { period: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece1cc" />
        <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#6b6558" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b6558" }} axisLine={false} tickLine={false} width={56} />
        <Tooltip
          formatter={(value) => formatBRL(Number(value))}
          contentStyle={{ borderRadius: 12, border: "1px solid #ece1cc", fontSize: 13 }}
        />
        <Bar dataKey="total" fill="#5c8a2e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
