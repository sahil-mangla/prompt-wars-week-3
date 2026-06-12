import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2, Globe, Home, MapPin, Utensils } from 'lucide-react';
import { UserProfile } from '../src/lib/types';

const HOUSING_TYPES = ['Apartment Renter', 'Homeowner', 'Student Dorm', 'Shared House'];
const DIET_OPTIONS = [
  { value: 'mixed', label: '🥩 Mixed (includes meat)' },
  { value: 'vegetarian', label: '🥚 Vegetarian' },
  { value: 'vegan', label: '🌱 Vegan' },
];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'San Francisco', 'New York', 'London', 'Berlin'];

export function ProfileModal({
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
