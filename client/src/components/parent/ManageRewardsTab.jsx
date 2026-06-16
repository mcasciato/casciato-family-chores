import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';

export default function ManageRewardsTab({
  rewardsList,
  onOpenRewardAdd,
  onOpenRewardEdit,
  onDeleteReward
}) {
  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <h3 style={{ fontSize: '1.25rem' }}>Loot Vault Stock (Rewards)</h3>
        <button
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem' }}
          onClick={onOpenRewardAdd}
        >
          <Plus size={16} /> Add Loot Reward
        </button>
      </div>

      {rewardsList.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          No rewards currently in the vault. Stock up some loot for the kids!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rewardsList.map((reward) => (
            <div
              key={reward.id}
              className="glass-card"
              style={{
                background: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1.25rem'
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{reward.title}</h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.2rem'
                  }}
                >
                  {reward.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ color: 'var(--theme-amber)', fontWeight: 700 }}>
                  🪙 {reward.points_cost} Gold
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem' }}
                    onClick={() => onOpenRewardEdit(reward)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem', color: 'var(--theme-rose)' }}
                    onClick={() => onDeleteReward(reward.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
