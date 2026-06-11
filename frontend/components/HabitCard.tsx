'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Leaf, Zap, TrendingUp, Settings, ChevronDown, X, Check, Loader2, Globe, Home, MapPin, Utensils } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface Habit {
  id: string;
  name: string;
  co2SavedPerDay: number;
  category: string;
  icon: string;
  description: string;
}

interface WeeklyMetrics {
  completions: number;
  completionRate: string;
  rawCo2Saved: number;
  streak: number;
  totalLifetimeCo2Saved: number;
}

interface HabitCardProps {
  userId: string;
  backendUrl: string;
}

interface UserProfile {
  language: string;
  city: string;
  housingType: string;
  diet: 'mixed' | 'vegetarian' | 'vegan';
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUSING_TYPES = ['Apartment Renter', 'Homeowner', 'Student Dorm', 'Shared House'];
const DIET_OPTIONS = [
  { value: 'mixed', label: '🥩 Mixed (includes meat)' },
  { value: 'vegetarian', label: '🥚 Vegetarian' },
  { value: 'vegan', label: '🌱 Vegan' },
];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'San Francisco', 'New York', 'London', 'Berlin'];

// ─── Typewriter Hook ──────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

// ─── SVG Carbon Chart ─────────────────────────────────────────────────────
function CarbonChart({ weeklyData }: { weeklyData: number[] }) {
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

// ─── Profile Modal ────────────────────────────────────────────────────────
function ProfileModal({
  profile, languages, onClose, onSave,
}: {
  profile: UserProfile;
  languages: Record<string, string>;
  onClose: () => void;
  onSave: (p: UserProfile) => void;
}) {
  const [form, setForm] = useState<UserProfile>({ ...profile });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(5, 10, 14, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        style={{
          background: 'rgba(10, 18, 24, 0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0fdf4' }}>Your Profile</h2>
          <button onClick={onClose} aria-label="Close profile settings" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Language */}
        <label style={labelStyle}>
          <Globe size={14} style={{ marginRight: 6 }} /> Language
        </label>
        <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} style={selectStyle} aria-label="Language preference">
          {Object.entries(languages).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        {/* City */}
        <label style={labelStyle}>
          <MapPin size={14} style={{ marginRight: 6 }} /> City
        </label>
        <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={selectStyle} aria-label="Your city">
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Housing Type */}
        <label style={labelStyle}>
          <Home size={14} style={{ marginRight: 6 }} /> Housing Type
        </label>
        <select value={form.housingType} onChange={e => setForm({ ...form, housingType: e.target.value })} style={selectStyle} aria-label="Housing type">
          {HOUSING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Diet */}
        <label style={labelStyle}>
          <Utensils size={14} style={{ marginRight: 6 }} /> Diet
        </label>
        <select value={form.diet} onChange={e => setForm({ ...form, diet: e.target.value as UserProfile['diet'] })} style={selectStyle} aria-label="Diet preference">
          {DIET_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '12px', marginTop: '20px',
            borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
            color: '#065f46', fontSize: '15px', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
          {saving ? 'Saving…' : 'Save Profile'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  fontSize: '11px', fontWeight: 600, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: '6px', marginTop: '16px',
};
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#f0fdf4', fontSize: '14px',
  cursor: 'pointer', outline: 'none',
};

// ─── Main HabitCard Component ─────────────────────────────────────────────
export const HabitCard: React.FC<HabitCardProps> = ({ userId, backendUrl }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [lifetimeSaved, setLifetimeSaved] = useState(0);
  const [coaching, setCoaching] = useState('');
  const [coachSource, setCoachSource] = useState<'gemini' | 'rules' | null>(null);
  const [loading, setLoading] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ language: 'en', city: 'Mumbai', housingType: 'Apartment Renter', diet: 'mixed' });
  const [languages, setLanguages] = useState<Record<string, string>>({ en: 'English' });
  const [checkedToday, setCheckedToday] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [justChecked, setJustChecked] = useState(false);

  const { displayed: typedCoaching, done: typingDone } = useTypewriter(coaching, 16);
  const today = new Date().toISOString().split('T')[0];

  // ─── Fetch Languages
  useEffect(() => {
    fetch(`${backendUrl}/api/languages`)
      .then(r => r.json())
      .then(d => d.languages && setLanguages(d.languages))
      .catch(() => {});
  }, [backendUrl]);

  // ─── Fetch Habits & Profile
  useEffect(() => {
    fetchHabits();
    fetchProfile();
  }, []);

  const fetchHabits = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/habits?lang=${profile.language}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch habits');
      setHabits(data.habits || []);
      if (data.habits?.length) selectHabit(data.habits[0].id);
    } catch (e: any) {
      setError('Cannot connect to backend. Make sure the server is running on port 5001.');
    }
  }, [backendUrl, profile.language]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/user/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(prev => ({ ...prev, ...data.profile }));
      }
    } catch {}
  }, [backendUrl, userId]);

  const selectHabit = useCallback(async (habitId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/habits/select`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, habitId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveHabit(data.activeHabit);
      setCompletions([]);
      setStreak(0);
      setTotalSaved(0);
      setCoaching('');
      setCheckedToday(false);
    } catch (e: any) {
      setError(e.message || 'Error selecting habit');
    } finally { setLoading(false); }
  }, [backendUrl, userId]);

  const logCompletion = useCallback(async () => {
    if (!activeHabit || checkedToday) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/habits/log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date: today }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompletions(data.completionsThisWeek || []);
      setStreak(data.streakCount);
      setTotalSaved(data.totalCo2Saved);
      setCheckedToday(true);
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 1500);
      // Update weekly history chart
      const dayIndex = new Date().getDay();
      setWeeklyHistory(prev => {
        const updated = [...prev];
        updated[dayIndex] = (updated[dayIndex] || 0) + (activeHabit.co2SavedPerDay);
        return updated;
      });
      // Auto-fetch coaching
      getCoachInsights();
    } catch (e: any) {
      setError(e.message || 'Error logging completion');
    } finally { setLoading(false); }
  }, [backendUrl, userId, activeHabit, checkedToday, today]);

  const getCoachInsights = useCallback(async () => {
    setCoachLoading(true);
    setCoaching('');
    try {
      const res = await fetch(`${backendUrl}/api/habits/coach`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoaching(data.coachingFeedback || '');
      setCoachSource(data.source || null);
      setLifetimeSaved(data.metrics?.totalLifetimeCo2Saved || 0);
    } catch (e: any) {
      setCoaching('Unable to load coaching insights at this time.');
    } finally { setCoachLoading(false); }
  }, [backendUrl, userId]);

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    try {
      await fetch(`${backendUrl}/api/user/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newProfile }),
      });
      setProfile(newProfile);
    } catch {}
  }, [backendUrl, userId]);

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {showProfile && (
          <ProfileModal
            profile={profile}
            languages={languages}
            onClose={() => setShowProfile(false)}
            onSave={saveProfile}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-card"
        style={{ maxWidth: '520px', width: '100%', padding: '28px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative glow ring */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={20} color="#34d399" /> Weekly Habit Coach
            </h2>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              📍 {profile.city} · {languages[profile.language] || 'English'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 20 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfile(true)}
            aria-label="Open profile settings"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
          >
            <Settings size={18} />
          </motion.button>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Habit Card */}
        <AnimatePresence mode="wait">
          {activeHabit && (
            <motion.div key={activeHabit.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Category Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                  background: 'rgba(52,211,153,0.1)', color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.2)',
                }}>
                  {activeHabit.icon} {activeHabit.category}
                </span>
              </div>

              {/* Habit Title */}
              <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: '#f0fdf4' }}>
                {activeHabit.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px', lineHeight: '1.5' }}>
                {activeHabit.description}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '8px', padding: '5px 10px', marginBottom: '24px' }}>
                <Zap size={13} color="#34d399" />
                <span style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: 500 }}>
                  Saves <strong>{activeHabit.co2SavedPerDay} kg CO₂</strong> per day completed
                </span>
              </div>

              {/* Weekly Progress Tracker */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Weekly Progress
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {WEEKDAYS.map((day, idx) => {
                    const isCompleted = completions.length > idx;
                    const isToday = new Date().getDay() === (idx + 1) % 7;
                    return (
                      <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <motion.div
                          initial={false}
                          animate={{
                            backgroundColor: isCompleted ? '#10b981' : 'rgba(255,255,255,0.04)',
                            borderColor: isCompleted ? '#34d399' : isToday ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)',
                            scale: isCompleted && justChecked && idx === completions.length - 1 ? [1, 1.3, 1] : 1,
                          }}
                          transition={{ duration: 0.3 }}
                          style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, color: '#ffffff',
                          }}
                        >
                          {isCompleted ? '✓' : ''}
                        </motion.div>
                        <span style={{ fontSize: '10px', color: isToday ? '#34d399' : '#6b7280', fontWeight: isToday ? 600 : 400 }}>
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: checkedToday ? 1 : 1.02, y: checkedToday ? 0 : -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={logCompletion}
                disabled={loading || checkedToday}
                id="habit-checkin-btn"
                aria-label={checkedToday ? 'Already checked in today' : 'Log habit completion for today'}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px',
                  border: checkedToday ? '1px solid rgba(52,211,153,0.3)' : 'none',
                  background: checkedToday
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.2))'
                    : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  color: checkedToday ? '#34d399' : '#065f46',
                  fontSize: '15px', fontWeight: 700, cursor: checkedToday || loading ? 'default' : 'pointer',
                  transition: 'all 0.2s', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading ? (
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : checkedToday ? (
                  <><Check size={18} /> Done for Today! ✨</>
                ) : (
                  '✅ I Did This Today!'
                )}
              </motion.button>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Completions', value: streak, icon: '🔥' },
                  { label: 'Saved This Week', value: `${totalSaved.toFixed(1)} kg`, icon: '🌿' },
                  { label: 'Lifetime Saved', value: `${lifetimeSaved.toFixed(1)} kg`, icon: '🌍' },
                ].map(stat => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.03 }}
                    style={{
                      padding: '12px 8px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '4px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Weekly CO₂ Chart */}
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <TrendingUp size={14} color="#34d399" />
                  <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Weekly Savings Trend</span>
                </div>
                <CarbonChart weeklyData={weeklyHistory} />
              </div>

              {/* AI Coach Section */}
              <div style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#60a5fa', fontWeight: 600 }}>
                    <span style={{ fontSize: '16px' }}>🤖</span> Carbon Coach
                    {coachSource && (
                      <span style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: 500,
                        background: coachSource === 'gemini' ? 'rgba(167,139,250,0.15)' : 'rgba(52,211,153,0.12)',
                        color: coachSource === 'gemini' ? '#a78bfa' : '#6ee7b7',
                        border: `1px solid ${coachSource === 'gemini' ? 'rgba(167,139,250,0.25)' : 'rgba(52,211,153,0.2)'}`,
                      }}>
                        {coachSource === 'gemini' ? '✦ Gemini' : '⚙ Rules'}
                      </span>
                    )}
                  </div>
                  {!coachLoading && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={getCoachInsights}
                      style={{ fontSize: '11px', color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Refresh ↺
                    </motion.button>
                  )}
                </div>

                {coachLoading ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Loader2 size={14} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>Coach is analyzing your progress…</span>
                  </div>
                ) : coaching ? (
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#d1d5db', whiteSpace: 'pre-wrap' }}>
                    {typedCoaching}
                    {!typingDone && <span style={{ animation: 'pulse 1s infinite', borderRight: '2px solid #60a5fa', marginLeft: '2px' }} />}
                  </p>
                ) : (
                  <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                    Check in today to receive personalized AI carbon insights! 🌱
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Habit Selector */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <label htmlFor="habit-selector" style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Switch Weekly Focus
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="habit-selector"
              onChange={e => selectHabit(e.target.value)}
              value={activeHabit?.id || ''}
              disabled={loading}
              aria-label="Select weekly habit to track"
              style={{
                width: '100%', padding: '10px 36px 10px 12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#f0fdf4', fontSize: '14px', cursor: 'pointer',
                outline: 'none', appearance: 'none',
              }}
            >
              {habits.map(h => <option key={h.id} value={h.id}>{h.icon} {h.name}</option>)}
            </select>
            <ChevronDown size={16} color="#9ca3af" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
      </motion.div>

      {/* Spin animation keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </>
  );
};
