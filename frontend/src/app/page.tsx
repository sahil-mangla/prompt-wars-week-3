'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HabitCard } from '../../components/HabitCard';

const BACKEND_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '' // same-origin in production (single container)
    : 'http://localhost:5001'; // dev

const USER_ID = 'test-user';

export default function Home() {
  return (
    <>
      {/* SEO Meta handled in layout.tsx */}
      <main
        id="main-content"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 16px 80px',
          gap: '32px',
        }}
      >
        {/* Hero Branding */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '44px', marginBottom: '12px' }}
            aria-hidden="true"
          >
            🌱
          </motion.div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#f0fdf4',
            margin: 0,
          }}>
            Habit<span style={{
              background: 'linear-gradient(135deg, #34d399 0%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Loop</span>
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#9ca3af',
            marginTop: '8px',
            maxWidth: '340px',
            lineHeight: '1.5',
          }}>
            One simple change per week. Real, measurable climate impact.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: '520px' }}
        >
          <HabitCard userId={USER_ID} backendUrl={BACKEND_URL} />
        </motion.div>

        {/* Trust Signal Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {['✦ Powered by Gemini 2.0', '🔒 Privacy First', '🌍 City-Aware CO₂'].map(badge => (
            <span key={badge} style={{
              fontSize: '11px', padding: '5px 12px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#6b7280', fontWeight: 500, letterSpacing: '0.02em',
            }}>
              {badge}
            </span>
          ))}
        </motion.div>

        {/* Footer */}
        <footer style={{
          marginTop: 'auto',
          fontSize: '11px',
          color: '#374151',
          textAlign: 'center',
          lineHeight: '1.6',
        }}>
          <p>HabitLoop · Built with Gemini AI + Firebase · PromptWars Week 3</p>
        </footer>
      </main>
    </>
  );
}
