interface Props {
  icon: string;
  value: string;
  label: string;
  delta?: string;
  deltaPositive?: boolean;
  tint: string; // tailwind bg for the icon chip
}

export default function StatCard({
  icon,
  value,
  label,
  delta,
  deltaPositive = true,
  tint,
}: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl text-base ${tint}`}
        >
          {icon}
        </span>
        {delta && (
          <span
            className={`pill ${
              deltaPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {deltaPositive ? "↗" : "↘"} {delta}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}
