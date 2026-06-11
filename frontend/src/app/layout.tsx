import './globals.css';
import React from 'react';

export const metadata = {
  title: 'HabitLoop – AI Carbon Coach | PromptWars Week 3',
  description: 'HabitLoop helps you build one weekly eco-habit at a time. Get city-aware CO₂ savings metrics and personalized AI coaching powered by Gemini 2.0.',
  keywords: ['carbon footprint', 'eco habits', 'climate action', 'Gemini AI', 'Firebase', 'habit tracker'],
  openGraph: {
    title: 'HabitLoop – AI Carbon Coach',
    description: 'Track eco-habits. Get personalized Gemini AI coaching. Reduce your carbon footprint — one week at a time.',
    type: 'website',
    locale: 'en_US',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050a0e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
