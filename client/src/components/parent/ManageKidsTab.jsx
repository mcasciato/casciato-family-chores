import React from 'react';
import { Coins, Edit3 } from 'lucide-react';

export default function ManageKidsTab({
  kids,
  onOpenKidEdit,
  onOpenAdjustment
}) {
  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
        Factions & Heroes (Children Profiles)
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {kids.map((kid) => (
          <div
            key={kid.id}
            className={`glass-card theme-${kid.color_theme}`}
            style={{
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1.5rem',
              padding: '1.25rem 1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  border: '2px solid var(--accent)'
                }}
              >
                {kid.avatar}
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{kid.name}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Level {Math.floor(kid.points / 100) + 1} Hero (Theme: {kid.color_theme})
                </span>
              </div>
            </div>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.03)'
                }}
              >
                <Coins size={18} style={{ color: 'var(--theme-amber)' }} />
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{kid.points}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gold</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                  onClick={() => onOpenKidEdit(kid)}
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  onClick={() => onOpenAdjustment(kid)}
                >
                  <Coins size={16} /> Adjust Gold
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
