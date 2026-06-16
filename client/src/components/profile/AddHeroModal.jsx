import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const avatars = ['🧙‍♂️', '🧝‍♀️', '🦁', '🐱', '🦄', '🦖', '🚀', '🐼', '🦊', '🎨', '⚽️', '🎸'];
const colors = ['violet', 'amber', 'emerald', 'rose', 'blue'];

export default function AddHeroModal({ isOpen, onClose, onSubmit }) {
  const [newKidName, setNewKidName] = useState('');
  const [newKidAvatar, setNewKidAvatar] = useState('🧙‍♂️');
  const [newKidColor, setNewKidColor] = useState('violet');
  const [newKidPin, setNewKidPin] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewKidName('');
      setNewKidAvatar('🧙‍♂️');
      setNewKidColor('violet');
      setNewKidPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitSubmit = (e) => {
    e.preventDefault();
    if (!newKidName.trim()) return;
    onSubmit({
      name: newKidName.trim(),
      avatar: newKidAvatar,
      color_theme: newKidColor,
      pin: newKidPin || '1234'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--theme-violet)' }} /> Summon New Hero
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
              value={newKidName}
              onChange={(e) => setNewKidName(e.target.value)}
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
              {avatars.map((av) => (
                <button
                  key={av}
                  type="button"
                  className="glass-card"
                  style={{
                    padding: '0.5rem',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    borderColor:
                      newKidAvatar === av ? 'var(--theme-violet)' : 'var(--card-border)',
                    background:
                      newKidAvatar === av ? 'var(--theme-violet-glow)' : 'transparent',
                    borderRadius: '12px'
                  }}
                  onClick={() => setNewKidAvatar(av)}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Accent Theme Color</span>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              {colors.map((col) => (
                <button
                  key={col}
                  type="button"
                  className={`btn theme-${col}`}
                  style={{
                    flex: 1,
                    background: `var(--theme-${col})`,
                    border: '3px solid',
                    borderColor: newKidColor === col ? '#ffffff' : 'transparent',
                    padding: '0.5rem',
                    borderRadius: '12px',
                    height: '24px'
                  }}
                  onClick={() => setNewKidColor(col)}
                />
              ))}
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Parent mode PIN (4-Digits)</span>
            <input
              type="password"
              className="glass-input"
              placeholder="1234"
              maxLength={4}
              value={newKidPin}
              onChange={(e) => setNewKidPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>

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
              Summon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
