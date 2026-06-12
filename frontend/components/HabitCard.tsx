'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Zap, TrendingUp, Settings, ChevronDown, Check, Loader2 } from 'lucide-react';
import { FlameIcon, SproutHandIcon, CO2CloudIcon, SparkleIcon } from './icons/CustomIcons';
import { CarbonChart } from './CarbonChart';
import { ProfileModal } from './ProfileModal';
import { Habit, UserProfile, HabitCardProps } from '../src/lib/types';
import { useTypewriter } from '../src/hooks/useTypewriter';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HabitCard: React.FC<HabitCardProps> = ({ userId, backendUrl }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [lifetimeSaved, setLifetimeSaved] = useState(0);
  const [coaching, setCoaching] = useState('');
  const coachingRef = useRef(coaching);
  useEffect(() => { coachingRef.current = coaching; }, [coaching]);
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
  const isFirstMount = useRef(true);

  // ─── Fetch Languages
  useEffect(() => {
    fetch(`${backendUrl}/api/languages`)
      .then(r => r.json())
      .then(d => d.languages && setLanguages(d.languages))
      .catch(() => {});
  }, [backendUrl]);

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

  const fetchHabits = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/habits?lang=${profile.language}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch habits');
      setHabits(data.habits || []);
      if (data.habits?.length) {
        setActiveHabit(prevActive => {
          if (prevActive) {
            const updated = data.habits.find((h: any) => h.id === prevActive.id);
            return updated || data.habits[0];
          }
          selectHabit(data.habits[0].id);
          return null;
        });
      }
    } catch (e: any) {
      setError('Cannot connect to backend. Please try refreshing the page.');
    }
  }, [backendUrl, profile.language, selectHabit]);

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

  const getCoachInsightsRef = useRef(getCoachInsights);
  useEffect(() => { getCoachInsightsRef.current = getCoachInsights; }, [getCoachInsights]);

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

      const jsDay = new Date().getDay(); 
      const chartIndex = jsDay === 0 ? 6 : jsDay - 1; 
      setWeeklyHistory(prev => {
        const updated = [...prev];
        updated[chartIndex] = (updated[chartIndex] || 0) + (activeHabit.co2SavedPerDay);
        return updated;
      });
      getCoachInsightsRef.current();
    } catch (e: any) {
      setError(e.message || 'Error logging completion');
    } finally { setLoading(false); }
  }, [backendUrl, userId, activeHabit, checkedToday, today]);

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    try {
      await fetch(`${backendUrl}/api/user/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newProfile }),
      });
      setProfile(newProfile);
    } catch {}
  }, [backendUrl, userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchHabits();
      return;
    }
    fetchHabits();
    if (coachingRef.current) {
      getCoachInsights();
    }
  }, [profile.language, fetchHabits, getCoachInsights]);

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
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

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

        <AnimatePresence mode="wait">
          {activeHabit && (
            <motion.div key={activeHabit.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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

              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  Weekly Progress
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {WEEKDAYS.map((day, idx) => {
                    const slotDayOfWeek = idx + 1 === 7 ? 0 : idx + 1;
                    const isCompleted = completions.some(dateStr => {
                      const d = new Date(dateStr + 'T00:00:00');
                      return d.getDay() === slotDayOfWeek;
                    });
                    const todayJsDay = new Date().getDay();
                    const isToday = hasMounted && todayJsDay === slotDayOfWeek;
                    const lastDate = completions[completions.length - 1];
                    const isLastAdded = lastDate ? new Date(lastDate + 'T00:00:00').getDay() === slotDayOfWeek : false;
                    return (
                      <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <motion.div
                          initial={false}
                          animate={{
                            backgroundColor: isCompleted ? '#10b981' : 'rgba(255,255,255,0.04)',
                            borderColor: isCompleted ? '#34d399' : isToday ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)',
                            scale: isCompleted && justChecked && isLastAdded ? [1, 1.3, 1] : 1,
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'This Week', value: `${completions.length}/7`, icon: <FlameIcon style={{ width: 18, height: 18, margin: '0 auto 4px auto', display: 'block', color: '#fb923c' }} /> },
                  { label: 'CO₂ This Week', value: `${totalSaved.toFixed(1)} kg`, icon: <CO2CloudIcon style={{ width: 18, height: 18, margin: '0 auto 4px auto', display: 'block', color: '#34d399' }} /> },
                  { label: 'Lifetime Saved', value: `${lifetimeSaved.toFixed(1)} kg`, icon: <SproutHandIcon style={{ width: 18, height: 18, margin: '0 auto 4px auto', display: 'block', color: '#60a5fa' }} /> },
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
                    {stat.icon}
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <TrendingUp size={14} color="#34d399" />
                  <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Weekly Savings Trend</span>
                </div>
                <CarbonChart weeklyData={weeklyHistory} />
              </div>

              <div style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#60a5fa', fontWeight: 600 }}>
                    <SparkleIcon style={{ width: 16, height: 16, color: '#60a5fa' }} /> Carbon Coach
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
                      aria-label="Refresh AI carbon coach insights"
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
                ) : (hasMounted && coaching) ? (
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </>
  );
};
