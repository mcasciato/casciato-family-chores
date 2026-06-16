import React from 'react';
import { Trophy, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function QuestsTab({ chores, onCompleteChore }) {
  if (chores.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>All Quests Clear!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          No active chores are scheduled for you today. Take a well-deserved rest!
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {chores.map((chore) => {
        const isPending = chore.completion_status === 'pending';
        const isApproved = chore.completion_status === 'approved';
        const isRejected = chore.completion_status === 'rejected';

        let cardClass = 'glass-card';
        if (isApproved) cardClass += ' active-theme-card';

        return (
          <div
            key={chore.id}
            className={cardClass}
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
                  {chore.schedule_type === 'alternate'
                    ? 'every other day'
                    : chore.schedule_type}
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
                  🪙 {chore.points}
                </div>
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
                  marginBottom: '0.5rem',
                  color: isApproved ? 'var(--accent)' : 'inherit'
                }}
              >
                {chore.title}
              </h3>
              <p
                style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}
              >
                {chore.description}
              </p>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {isApproved && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--theme-emerald)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  <CheckCircle size={18} /> Quest Complete & Approved!
                </div>
              )}

              {isPending && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--theme-amber)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  <Clock size={18} className="logo-icon" /> Under Review by Parents
                </div>
              )}

              {isRejected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--theme-rose)',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    <AlertTriangle size={18} /> Revision Needed
                  </div>
                  {chore.completion_feedback && (
                    <p
                      style={{
                        background: 'rgba(244,63,94,0.05)',
                        borderLeft: '3px solid var(--theme-rose)',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        borderRadius: '4px'
                      }}
                    >
                      &ldquo;{chore.completion_feedback}&rdquo;
                    </p>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '0.25rem' }}
                    onClick={() => onCompleteChore(chore.id)}
                  >
                    Resubmit Quest <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {chore.completion_status === 'uncompleted' && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '0.25rem' }}
                  onClick={() => onCompleteChore(chore.id)}
                >
                  Complete Quest <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
