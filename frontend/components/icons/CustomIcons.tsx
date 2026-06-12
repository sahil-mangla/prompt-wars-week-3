import React from 'react';

export const FlameIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2c-.44 0-.85.24-1.07.63-.67 1.18-1.44 2.37-2.18 3.56C7.56 8.13 6 10.45 6 13c0 3.31 2.69 6 6 6s6-2.69 6-6c0-2.55-1.56-4.87-2.75-6.81l-2.18-3.56c-.22-.39-.63-.63-1.07-.63zm0 13c-1.1 0-2-.9-2-2 0-1.33 1.5-2.75 2-3.25.5.5 2 1.92 2 3.25 0 1.1-.9 2-2 2z" />
  </svg>
);

export const SproutHandIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20 14h-5.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5H20c.8 0 1.5.7 1.5 1.5S20.8 14 20 14z" />
    <path d="M2 15.5C2 14.7 2.7 14 3.5 14H11c.8 0 1.5.7 1.5 1.5v1c0 .8-.7 1.5-1.5 1.5H3.5C2.7 18 2 17.3 2 16.5v-1z" opacity="0.8" />
    <path d="M12 9c-2 0-3.5-1.5-3.5-3.5 0 2 1.5 3.5 3.5 3.5z" />
    <path d="M12 9c2 0 3.5-1.5 3.5-3.5 0 2-1.5 3.5-3.5 3.5z" />
    <path d="M11 8.5h2V12h-2z" />
  </svg>
);

export const CO2CloudIcon = (props: React.SVGProps<SVGSVGElement>) => {
  const id = React.useId();
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <defs>
        <mask id={id}>
          <rect width="24" height="24" fill="white" />
          <text x="12" y="14.5" fill="black" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">CO₂</text>
        </mask>
      </defs>
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" mask={`url(#${id})`} />
    </svg>
  );
};

export const SparkleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" />
  </svg>
);
