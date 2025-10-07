import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RecordChartProps = {
  wins: number;
  draws: number;
  losses: number;
};

const colors = {
  wins: "#34d399",
  draws: "#94a3b8",
  losses: "#f87171",
};

const RecordChart: React.FC<RecordChartProps> = ({ wins, draws, losses }) => {
  const data = [
    { name: "Победы", value: wins, fill: colors.wins },
    { name: "Ничьи", value: draws, fill: colors.draws },
    { name: "Поражения", value: losses, fill: colors.losses },
  ];

  return (
    <div className="h-64 w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Баланс результатов</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="name" stroke="rgba(148, 163, 184, 0.8)" />
          <YAxis allowDecimals={false} stroke="rgba(148, 163, 184, 0.8)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "0.75rem",
              color: "#e2e8f0",
            }}
            cursor={{ fill: "rgba(99, 102, 241, 0.12)" }}
          />
          <Bar dataKey="value" radius={[12, 12, 12, 12]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RecordChart;
