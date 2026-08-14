"use client";

interface Props {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export default function BarChart({ data, height = 180, color = "#7c3aed" }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = 100 / (data.length * 1.6);
  const gap = barW * 0.6;

  return (
    <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="h-44 w-full">
      {data.map((d, i) => {
        const h = (d.value / max) * (height / 2 - 12);
        const x = i * (barW + gap) + gap;
        const y = height / 2 - h - 6;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1.2}
              fill={color}
              opacity={0.85}
            >
              <title>
                {d.label}: {d.value}
              </title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
