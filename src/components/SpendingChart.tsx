import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMonthlyStats } from "@/hooks/useFinanceData";

const COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(217, 91%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(190, 70%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(120, 40%, 50%)",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function SpendingChart() {
  const { data: stats, isLoading } = useMonthlyStats();

  if (isLoading) {
    return <div className="w-48 h-48 mx-auto bg-muted rounded-full animate-pulse" />;
  }

  if (!stats || Object.keys(stats.categories).length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Sem gastos este mês.</p>
      </div>
    );
  }

  const data = Object.entries(stats.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontFamily: "Public Sans",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
