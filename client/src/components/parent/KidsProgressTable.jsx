import React, { useState } from 'react';
import { Coins } from 'lucide-react';

export default function KidsProgressTable({
  kids,
  kidsProgress,
  kidsChores,
  onOpenKidEdit,
  onOpenAdjustment
}) {
  const [expandedKidId, setExpandedKidId] = useState(null);

  return (
    <div className="glass-panel" style={{ marginBottom: '2.5rem', padding: '1.5rem 2rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>📈</span> Heroes' Today Campaign Progress
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Hero</th>
              <th style={{ padding: '0.75rem 1rem' }}>Level</th>
              <th style={{ padding: '0.75rem 1rem' }}>Gold Coins</th>
              <th style={{ padding: '0.75rem 1rem' }}>Today's Campaign</th>
              <th style={{ padding: '0.75rem 1rem' }}>Progress</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kids.map((kid) => {
              const prog = kidsProgress[kid.id] || { completed: 0, approved: 0, pending: 0, total: 0 };
              const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
              const level = Math.floor(kid.points / 100) + 1;
              const isExpanded = expandedKidId === kid.id;
              const chores = kidsChores[kid.id] || [];

              // Status Determination
              let statusLabel = 'No Quests';
              let statusColor = 'var(--text-muted)';
              let statusBg = 'rgba(255, 255, 255, 0.05)';

              if (prog.total > 0) {
                if (prog.approved === prog.total) {
                  statusLabel = 'Campaign Complete! 🎉';
                  statusColor = 'var(--theme-emerald)';
                  statusBg = 'var(--theme-emerald-glow)';
                } else if (prog.pending > 0) {
                  statusLabel = 'Pending Review ⏳';
                  statusColor = 'var(--theme-amber)';
                  statusBg = 'var(--theme-amber-glow)';
                } else if (prog.completed > 0) {
                  statusLabel = 'In Progress ⚔️';
                  statusColor = 'var(--accent, var(--theme-violet))';
                  statusBg = 'var(--accent-glow, var(--theme-violet-glow))';
                } else {
                  statusLabel = 'Not Started 💤';
                  statusColor = 'var(--text-muted)';
                  statusBg = 'rgba(255, 255, 255, 0.03)';
                }
              }

              return (
                <React.Fragment key={kid.id}>
                  <tr className={`theme-${kid.color_theme}`} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td 
                      style={{ 
                        padding: '1rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => setExpandedKidId(isExpanded ? null : kid.id)}
                    >
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)', 
                        display: 'inline-block',
                        width: '12px',
                        transition: 'transform 0.2s ease', 
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' 
                      }}>
                        ▶
                      </span>
                      <span style={{ fontSize: '1.75rem' }}>{kid.avatar}</span>
                      <strong style={{ fontSize: '1rem' }}>{kid.name}</strong>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Lvl {level}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--theme-amber)' }}>🪙 {kid.points}</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      {prog.total > 0 ? (
                        <span>{prog.completed}/{prog.total} Quests</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None Scheduled</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', width: '200px' }}>
                      {prog.total > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-container" style={{ flex: 1, height: '6px' }}>
                            <div className="progress-bar" style={{ width: `${percent}%`, backgroundColor: 'var(--accent)' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '30px' }}>{percent}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: statusColor,
                        background: statusBg,
                        border: `1px solid ${statusColor}33`
                      }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => onOpenKidEdit(kid)}
                        >
                          Edit Profile
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          onClick={() => onOpenAdjustment(kid)}
                        >
                          <Coins size={12} /> Adjust Gold
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Quest List Sub-row */}
                  <tr className={`theme-${kid.color_theme}`}>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <div style={{
                        maxHeight: isExpanded ? '500px' : '0px',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: 'rgba(0, 0, 0, 0.15)',
                      }}>
                        <div style={{ padding: '1.25rem 2.5rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>⚔️</span> Active Quests for Today
                          </h4>
                          {chores.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                              No chores scheduled for today.
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              {chores.map((chore) => {
                                let statusText = 'Not Started';
                                let statusBadgeColor = 'var(--text-muted)';
                                let statusBadgeBg = 'rgba(255, 255, 255, 0.05)';
                                if (chore.completion_status === 'approved') {
                                  statusText = 'Approved';
                                  statusBadgeColor = 'var(--theme-emerald)';
                                  statusBadgeBg = 'var(--theme-emerald-glow)';
                                } else if (chore.completion_status === 'pending') {
                                  statusText = 'Pending Approval';
                                  statusBadgeColor = 'var(--theme-amber)';
                                  statusBadgeBg = 'var(--theme-amber-glow)';
                                } else if (chore.completion_status === 'rejected') {
                                  statusText = 'Rejected (Needs Redo)';
                                  statusBadgeColor = 'var(--theme-rose)';
                                  statusBadgeBg = 'rgba(244, 63, 94, 0.15)';
                                }

                                return (
                                  <div 
                                    key={chore.id} 
                                    style={{
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center', 
                                      padding: '0.6rem 1rem', 
                                      background: 'rgba(255, 255, 255, 0.02)',
                                      border: '1px solid var(--card-border)',
                                      borderRadius: '8px',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                      <strong style={{ color: 'var(--text-main)' }}>{chore.title}</strong>
                                      {chore.description && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                          {chore.description}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                      <span style={{ color: 'var(--theme-amber)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        🪙 {chore.points}
                                      </span>
                                      <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: statusBadgeColor,
                                        background: statusBadgeBg,
                                        border: `1px solid ${statusBadgeColor}22`
                                      }}>
                                        {statusText}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
