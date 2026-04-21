interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span
        className={`text-xl font-bold leading-tight ${accent ? "text-red-500" : "text-gray-900"}`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}
