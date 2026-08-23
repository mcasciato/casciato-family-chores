import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { THEME_PACKS } from '../../theme/themePacks';

export default function SetupVibeStep({ selectedTheme, onSelectTheme, onNext, onOpenJoinModal }) {
  return (
    <div className="setup-form-step">
      <h2>🎨 Choose Your Family's Vibe</h2>
      <p className="description">
        Pick a theme that fits your household. All terms, task labels, rewards, currency icons, and avatars will adapt to your style!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1.25rem 0' }}>
        {Object.values(THEME_PACKS).map((pack) => {
          const isSelected = selectedTheme === pack.id;
          return (
            <div
              key={pack.id}
              onClick={() => onSelectTheme(pack.id)}
              style={{
                padding: '1rem',
                borderRadius: '14px',
                border: isSelected ? '2px solid var(--theme-violet, #8b5cf6)' : '1px solid var(--card-border)',
                background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.75rem' }}>{pack.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{pack.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {pack.currencyIcon} {pack.currencyName}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pack.tagline}</span>
                </div>
              </div>

              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid var(--theme-violet)' : '2px solid rgba(255,255,255,0.2)',
                  background: isSelected ? 'var(--theme-violet)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                {isSelected && <Check size={13} />}
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn-setup-next" onClick={onNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <span>Continue to Setup</span>
        <ArrowRight size={16} />
      </button>

      {/* Alternative Join Link */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <button
          type="button"
          onClick={onOpenJoinModal}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Already have a family? Join or Link this Device
        </button>
      </div>
    </div>
  );
}
