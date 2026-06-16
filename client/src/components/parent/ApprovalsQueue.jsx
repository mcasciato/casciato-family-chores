import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

export default function ApprovalsQueue({
  pendingCompletions,
  pendingRedemptions,
  onApproveCompletion,
  onApproveAllCompletions,
  onRejectCompletion,
  onRejectAllCompletions,
  onFulfillRedemption
}) {
  const [rejectionFeedback, setRejectionFeedback] = useState({ completionId: null, feedback: '' });

  const handleOpenRejection = (id) => {
    setRejectionFeedback({ completionId: id, feedback: '' });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (rejectionFeedback.completionId) {
      onRejectCompletion(rejectionFeedback.completionId, rejectionFeedback.feedback);
      setRejectionFeedback({ completionId: null, feedback: '' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Chore Approvals Queue */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <h3
            style={{
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0
            }}
          >
            ⚔️ Quest Verifications ({pendingCompletions.length})
          </h3>
          {pendingCompletions.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  borderColor: 'var(--theme-rose-border)',
                  color: 'var(--theme-rose)'
                }}
                onClick={onRejectAllCompletions}
              >
                <X size={14} /> Reject All ({pendingCompletions.length})
              </button>
              <button
                className="btn btn-primary"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  background: 'var(--theme-emerald)',
                  color: 'var(--text-dark)'
                }}
                onClick={onApproveAllCompletions}
              >
                <Check size={14} /> Approve All ({pendingCompletions.length})
              </button>
            </div>
          )}
        </div>

        {pendingCompletions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', padding: '1rem 0' }}>
            All clear! No completed quests are waiting for approval.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingCompletions.map((completion) => (
              <div
                key={completion.id}
                className="glass-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{completion.kid_avatar}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{completion.kid_name}</strong>
                      <span className="badge badge-pending">Pending</span>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', margin: '0.2rem 0', fontWeight: 600 }}>
                      {completion.chore_title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Submitted:{' '}
                      {new Date(completion.completed_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}{' '}
                      ({completion.completed_date})
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{ color: 'var(--theme-amber)', fontWeight: 700, fontSize: '1.1rem' }}
                  >
                    🪙 +{completion.chore_points} Gold
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderColor: 'var(--theme-rose-border)',
                        color: 'var(--theme-rose)'
                      }}
                      onClick={() => handleOpenRejection(completion.id)}
                    >
                      <X size={16} /> Reject
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--theme-emerald)',
                        color: 'var(--text-dark)'
                      }}
                      onClick={() =>
                        onApproveCompletion(
                          completion.id,
                          completion.kid_name,
                          completion.chore_points
                        )
                      }
                    >
                      <Check size={16} /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reward Redemptions Queue */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3
          style={{
            fontSize: '1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          🎁 Loot Redemptions ({pendingRedemptions.length})
        </h3>

        {pendingRedemptions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', padding: '1rem 0' }}>
            All clear! No children have redeemed pending loot rewards.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="glass-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{redemption.kid_avatar}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{redemption.kid_name}</strong>
                      <span className="badge badge-approved">Purchased</span>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', margin: '0.2rem 0', fontWeight: 600 }}>
                      {redemption.reward_title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Redeemed:{' '}
                      {new Date(redemption.redeemed_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{ color: 'var(--theme-amber)', fontWeight: 700, fontSize: '1.1rem' }}
                  >
                    🪙 -{redemption.reward_cost} Gold (Deducted)
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'var(--theme-parent)',
                      color: 'var(--text-white)'
                    }}
                    onClick={() => onFulfillRedemption(redemption.id)}
                  >
                    <Check size={16} /> Deliver Loot
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Feedback Prompt Modal */}
      {rejectionFeedback.completionId && (
        <div className="modal-overlay">
          <div className="glass-card modal-content theme-parent">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem', color: 'var(--theme-rose)' }}>
                Revision Instructions
              </h3>
              <button
                className="modal-close"
                onClick={() => setRejectionFeedback({ completionId: null, feedback: '' })}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleRejectSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                Help the hero understand what needs to be improved in their work before they claim
                the gold coins.
              </p>

              <div className="input-group">
                <span className="input-label">Feedback Notes</span>
                <textarea
                  className="glass-textarea"
                  rows={3}
                  placeholder="e.g. Please put away your shoes in the closet as well."
                  value={rejectionFeedback.feedback}
                  onChange={(e) =>
                    setRejectionFeedback({ ...rejectionFeedback, feedback: e.target.value })
                  }
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setRejectionFeedback({ completionId: null, feedback: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>
                  Return for Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
