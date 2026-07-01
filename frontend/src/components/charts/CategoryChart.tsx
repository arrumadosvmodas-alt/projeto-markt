import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "../ui";

export function CategoryChart({ categories }: { categories: { category: string; total: number }[] }) {
  const top = categories.slice(0, 6);

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, top.length * 42)}>
      <BarChart data={top} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ece1cc" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#6b6558" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12, fill: "#423d34" }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip
          formatter={(value) => formatBRL(Number(value))}
          contentStyle={{ borderRadius: 12, border: "1px solid #ece1cc", fontSize: 13 }}
        />
        <Bar dataKey="total" fill="#e0935a" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
