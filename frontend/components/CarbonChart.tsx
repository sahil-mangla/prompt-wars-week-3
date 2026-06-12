import React from 'react';

export function CarbonChart({ weeklyData }: { weeklyData: number[] }) {
  const max = Math.max(...weeklyData, 1);
  const width = 280;
  const height = 60;
  const points = weeklyData.map((v, i) => {
    const x = (i / (weeklyData.length - 1)) * width;
    const y = height - (v / max) * height * 0.85 - 4;
    return `${x},${y}`;
  }).join(' ');

  const area = `M 0,${height} L ${weeklyData.map((v, i) => {
    const x = (i / (weeklyData.length - 1)) * width;
    const y = height - (v / max) * height * 0.85 - 4;
    return `${x},${y}`;
  }).join(' L ')} L ${width},${height} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Weekly CO₂ savings chart">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
