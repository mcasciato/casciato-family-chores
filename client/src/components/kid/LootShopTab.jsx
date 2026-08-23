import React from 'react';
import { ShoppingBag, Award } from 'lucide-react';
import { useThemePack } from '../../context/ThemePackContext';

export default function LootShopTab({ rewards, kidPoints, onRedeemReward }) {
  const { themePack } = useThemePack();

  if (rewards.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{themePack?.rewardLabel || 'Reward Shop'} Empty</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          There are currently no rewards stocked. Remind parents to add some rewards!
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {rewards.map((reward) => {
        const canAfford = kidPoints >= reward.points_cost;

        return (
          <div
            key={reward.id}
            className="glass-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '180px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}
              >
                <span
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}
                >
                  Reward
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--theme-amber)',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}
                >
                  <span>{themePack?.currencyIcon || '⭐'}</span> {reward.points_cost}
                </div>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {reward.title}
              </h3>
              <p
                style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}
              >
                {reward.description}
              </p>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  gap: '0.5rem',
                  background: canAfford
                    ? 'linear-gradient(135deg, var(--theme-amber) 0%, #fbbf24 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: canAfford ? 'var(--text-dark)' : 'var(--text-muted)',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  boxShadow: canAfford ? '0 4px 12px rgba(245,158,11,0.2)' : 'none'
                }}
                disabled={!canAfford}
                onClick={() => onRedeemReward(reward)}
              >
                <Award size={18} />
                {canAfford ? 'Claim Reward' : 'Need More Gold'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
