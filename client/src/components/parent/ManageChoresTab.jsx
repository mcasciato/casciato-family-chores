import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';

export default function ManageChoresTab({
  choresList,
  onOpenChoreAdd,
  onOpenChoreEdit,
  onDeleteChore
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
        <h3 style={{ fontSize: '1.25rem' }}>Active Quest Board (Chores)</h3>
        <button
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem' }}
          onClick={onOpenChoreAdd}
        >
          <Plus size={16} /> Create Quest
        </button>
      </div>

      {choresList.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          No quests currently in the database. Create one to begin!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {choresList.map((chore) => (
            <div
              key={chore.id}
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
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {chore.title}{' '}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.15rem 0.5rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginLeft: '0.5rem'
                    }}
                  >
                    {chore.schedule_type === 'alternate'
                      ? 'every other day'
                      : chore.schedule_type}
                  </span>
                </h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.2rem'
                  }}
                >
                  {chore.description || 'No description provided.'}
                </p>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--accent, var(--theme-violet))',
                    fontWeight: 500,
                    marginTop: '0.25rem',
                    display: 'inline-block'
                  }}
                >
                  Assigned To:{' '}
                  {chore.assigned_to_name
                    ? `${chore.assigned_to_avatar} ${chore.assigned_to_name}`
                    : '🌎 Everyone'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ color: 'var(--theme-amber)', fontWeight: 700 }}>
                  🪙 {chore.points} Gold
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem' }}
                    onClick={() => onOpenChoreEdit(chore)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem', color: 'var(--theme-rose)' }}
                    onClick={() => onDeleteChore(chore.id)}
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
