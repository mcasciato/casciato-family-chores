import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { THEME_PACKS } from '../../../theme/themePacks';
import { useThemePack } from '../../../context/ThemePackContext';

export default function ThemeSelectModal({ isOpen, onClose }) {
  const { themePackId, updateThemePack } = useThemePack();
  const [selectedId, setSelectedId] = useState(themePackId);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (selectedId === themePackId) {
      onClose();
      return;
    }
    setSaving(true);
    await updateThemePack(selectedId);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card animate-scale-in"
        style={{ maxWidth: '640px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🎨</span>
            <h2 style={{ margin: 0, fontSize: '1.35rem' }}>Family Vibe & Theme</h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Choose a theme pack that fits your household. All terms, daily chore titles, rewards, currency icons, and avatars will adapt instantly!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
          {Object.values(THEME_PACKS).map((pack) => {
            const isSelected = selectedId === pack.id;
            const isCurrent = themePackId === pack.id;

            return (
              <div
                key={pack.id}
                onClick={() => setSelectedId(pack.id)}
                style={{
                  padding: '1.2rem',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid var(--theme-violet, #8b5cf6)' : '1px solid var(--card-border)',
                  background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>{pack.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{pack.name}</h4>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              fontWeight: 600
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pack.tagline}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid var(--theme-violet)' : '2px solid rgba(255,255,255,0.2)',
                      background: isSelected ? 'var(--theme-violet)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                </div>

                {/* Theme Highlights Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.15)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Member</span>
                    <strong>{pack.memberLabel}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Daily Tasks</span>
                    <strong>{pack.taskLabel}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Reward Shop</span>
                    <strong>{pack.rewardLabel}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Currency</span>
                    <strong>{pack.currencyIcon} {pack.currencyName}</strong>
                  </div>
                </div>

                {/* Sample Avatars Row */}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', overflowX: 'auto', paddingBottom: '2px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Avatars:</span>
                  {pack.avatars.slice(0, 8).map((av, idx) => (
                    <span key={idx} style={{ fontSize: '1.15rem' }}>{av}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            <Sparkles size={16} />
            <span>{saving ? 'Applying...' : 'Apply Theme'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
