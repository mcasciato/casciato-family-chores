import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const avatarsList = ['🧙‍♂️', '🧝‍♀️', '🦁', '🐱', '🦄', '🦖', '🚀', '🐼', '🦊', '🎨', '⚽️', '🎸'];
const colorsList = ['violet', 'amber', 'emerald', 'rose', 'blue'];

export default function KidEditModal({
  isOpen,
  onClose,
  kid,
  editError,
  onSubmit
}) {
  const [form, setForm] = useState({
    id: null,
    name: '',
    avatar: '🧙‍♂️',
    color_theme: 'violet',
    pin: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (kid) {
        setForm({
          id: kid.id || null,
          name: kid.name || '',
          avatar: kid.avatar || '🧙‍♂️',
          color_theme: kid.color_theme || 'violet',
          pin: kid.pin || ''
        });
      } else {
        setForm({
          id: null,
          name: '',
          avatar: '🧙‍♂️',
          color_theme: 'violet',
          pin: ''
        });
      }
    }
  }, [isOpen, kid]);

  if (!isOpen) return null;

  const handleSubmitSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className={`glass-card modal-content theme-${form.color_theme}`}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: `var(--theme-${form.color_theme})` }} />{' '}
            {form.id ? 'Edit Hero Profile' : 'Forge New Hero'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form
          onSubmit={handleSubmitSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div className="input-group">
            <span className="input-label">Hero Name</span>
            <input
              type="text"
              className="glass-input"
              placeholder="Enter name..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={15}
              required
            />
          </div>

          <div className="input-group">
            <span className="input-label">Choose Avatar Emoji</span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.5rem',
                marginTop: '0.25rem'
              }}
            >
              {avatarsList.map((av) => (
                <button
                  key={av}
                  type="button"
                  className="glass-card"
                  style={{
                    padding: '0.5rem',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    borderColor:
                      form.avatar === av
                        ? `var(--theme-${form.color_theme})`
                        : 'var(--card-border)',
                    background:
                      form.avatar === av
                        ? `var(--theme-${form.color_theme}-glow)`
                        : 'transparent',
                    borderRadius: '12px'
                  }}
                  onClick={() => setForm({ ...form, avatar: av })}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Accent Theme Color</span>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              {colorsList.map((col) => (
                <button
                  key={col}
                  type="button"
                  className={`btn theme-${col}`}
                  style={{
                    flex: 1,
                    background: `var(--theme-${col})`,
                    border: '3px solid',
                    borderColor: form.color_theme === col ? '#ffffff' : 'transparent',
                    padding: '0.5rem',
                    borderRadius: '12px',
                    height: '24px'
                  }}
                  onClick={() => setForm({ ...form, color_theme: col })}
                />
              ))}
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">PIN (4-Digits)</span>
            <input
              type="password"
              className="glass-input"
              placeholder="••••"
              maxLength={4}
              value={form.pin}
              onChange={(e) =>
                setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })
              }
            />
          </div>

          {editError && (
            <div
              style={{ color: 'var(--theme-rose)', fontSize: '0.9rem', textAlign: 'center' }}
            >
              {editError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
