import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Moradia", value: 1800, color: "hsl(160, 84%, 39%)" },
  { name: "Alimentação", value: 850, color: "hsl(217, 91%, 60%)" },
  { name: "Transporte", value: 340, color: "hsl(38, 92%, 50%)" },
  { name: "Assinaturas", value: 155, color: "hsl(280, 60%, 55%)" },
  { name: "Saúde", value: 89, color: "hsl(0, 84%, 60%)" },
  { name: "Lazer", value: 280, color: "hsl(190, 70%, 50%)" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function SpendingChart() {
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
                fontSize: "13px"
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
