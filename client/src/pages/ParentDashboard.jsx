import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Plus, Trash2, Edit3, UserPlus, Coins, Sword, Gift, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const avatarsList = ['🧙‍♂️', '🧝‍♀️', '🦁', '🐱', '🦄', '🦖', '🚀', '🐼', '🦊', '🎨', '⚽️', '🎸'];
const colorsList = ['violet', 'amber', 'emerald', 'rose', 'blue'];

export default function ParentDashboard({ kids, parentToken, onBackToProfiles, onReloadKids }) {
  const [activeTab, setActiveTab] = useState('approvals'); // approvals, chores, rewards, kids
  const [pendingCompletions, setPendingCompletions] = useState([]);
  const [pendingRedemptions, setPendingRedemptions] = useState([]);
  const [choresList, setChoresList] = useState([]);
  const [rewardsList, setRewardsList] = useState([]);

  // Modals & Forms State
  const [isChoreModalOpen, setIsChoreModalOpen] = useState(false);
  const [choreForm, setChoreForm] = useState({ id: null, title: '', description: '', points: 10, schedule_type: 'daily', schedule_days: '', assigned_to: '' });

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState({ id: null, title: '', description: '', points_cost: 50 });

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({ kidId: '', kidName: '', amount: 0 });

  const [rejectionFeedback, setRejectionFeedback] = useState({ completionId: null, feedback: '' });

  const [isKidEditModalOpen, setIsKidEditModalOpen] = useState(false);
  const [kidEditForm, setKidEditForm] = useState({ id: '', name: '', avatar: '', color_theme: '', pin: '' });
  const [editError, setEditError] = useState('');

  // Load backend queues and resources
  useEffect(() => {
    fetchQueues();
    fetchResources();
  }, [activeTab]);

  const fetchQueues = async () => {
    try {
      const completionsRes = await fetch('/api/completions/pending', {
        headers: { 'x-parent-token': parentToken }
      });
      const completionsData = await completionsRes.json();
      setPendingCompletions(completionsData);

      const redemptionsRes = await fetch('/api/redemptions/pending', {
        headers: { 'x-parent-token': parentToken }
      });
      const redemptionsData = await redemptionsRes.json();
      setPendingRedemptions(redemptionsData);
    } catch (err) {
      console.error('Error fetching approval queues:', err);
    }
  };

  const fetchResources = async () => {
    try {
      const choresRes = await fetch('/api/chores');
      const choresData = await choresRes.json();
      setChoresList(choresData);

      const rewardsRes = await fetch('/api/rewards');
      const rewardsData = await rewardsRes.json();
      setRewardsList(rewardsData);
    } catch (err) {
      console.error('Error fetching chores/rewards details:', err);
    }
  };

  // Chore approval actions
  const handleApproveChore = async (id, kidName, points) => {
    try {
      const res = await fetch(`/api/completions/${id}/approve`, {
        method: 'PUT',
        headers: { 'x-parent-token': parentToken }
      });
      if (res.ok) {
        // Exploding stars & coins confetti burst for kid approval!
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.5 },
          colors: ['#f59e0b', '#10b981', '#fbbf24']
        });

        fetchQueues();
        onReloadKids(); // Reload global list of kids
      }
    } catch (err) {
      console.error('Error approving chore:', err);
    }
  };

  const handleOpenRejection = (id) => {
    setRejectionFeedback({ completionId: id, feedback: '' });
  };

  const handleRejectChore = async (e) => {
    e.preventDefault();
    const { completionId, feedback } = rejectionFeedback;
    if (!completionId) return;

    try {
      const res = await fetch(`/api/completions/${completionId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-token': parentToken
        },
        body: JSON.stringify({ feedback: feedback || 'Please redo this task.' })
      });
      if (res.ok) {
        setRejectionFeedback({ completionId: null, feedback: '' });
        fetchQueues();
      }
    } catch (err) {
      console.error('Error rejecting chore:', err);
    }
  };

  // Reward redemption actions
  const handleFulfillRedemption = async (id) => {
    try {
      const res = await fetch(`/api/redemptions/${id}/fulfill`, {
        method: 'PUT',
        headers: { 'x-parent-token': parentToken }
      });
      if (res.ok) {
        // Celebratory green pop
        confetti({
          particleCount: 50,
          spread: 30,
          colors: ['#10b981', '#34d399']
        });
        fetchQueues();
      }
    } catch (err) {
      console.error('Error fulfilling redemption:', err);
    }
  };

  // Chore CRUD Handlers
  const handleOpenChoreCreate = () => {
    setChoreForm({ id: null, title: '', description: '', points: 15, schedule_type: 'daily', schedule_days: '', assigned_to: '' });
    setIsChoreModalOpen(true);
  };

  const handleOpenChoreEdit = (chore) => {
    setChoreForm({
      id: chore.id,
      title: chore.title,
      description: chore.description || '',
      points: chore.points,
      schedule_type: chore.schedule_type,
      schedule_days: chore.schedule_days || '',
      assigned_to: chore.assigned_to || ''
    });
    setIsChoreModalOpen(true);
  };

  const handleChoreFormSubmit = async (e) => {
    e.preventDefault();
    const { id, title, description, points, schedule_type, schedule_days, assigned_to } = choreForm;

    const body = {
      title,
      description,
      points: Number(points),
      schedule_type,
      schedule_days: schedule_type === 'custom' ? schedule_days : null,
      assigned_to: assigned_to ? Number(assigned_to) : null
    };

    try {
      let res;
      if (id) {
        res = await fetch(`/api/chores/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-parent-token': parentToken
          },
          body: JSON.stringify(body)
        });
      } else {
        res = await fetch('/api/chores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-parent-token': parentToken
          },
          body: JSON.stringify(body)
        });
      }

      if (res.ok) {
        setIsChoreModalOpen(false);
        fetchResources();
      }
    } catch (err) {
      console.error('Error saving chore:', err);
    }
  };

  const handleDeleteChore = async (id) => {
    if (!confirm('Are you sure you want to delete this chore?')) return;
    try {
      const res = await fetch(`/api/chores/${id}`, {
        method: 'DELETE',
        headers: { 'x-parent-token': parentToken }
      });
      if (res.ok) fetchResources();
    } catch (err) {
      console.error('Error deleting chore:', err);
    }
  };

  // Reward CRUD Handlers
  const handleOpenRewardCreate = () => {
    setRewardForm({ id: null, title: '', description: '', points_cost: 50 });
    setIsRewardModalOpen(true);
  };

  const handleOpenRewardEdit = (reward) => {
    setRewardForm({
      id: reward.id,
      title: reward.title,
      description: reward.description || '',
      points_cost: reward.points_cost
    });
    setIsRewardModalOpen(true);
  };

  const handleRewardFormSubmit = async (e) => {
    e.preventDefault();
    const { id, title, description, points_cost } = rewardForm;

    const body = {
      title,
      description,
      points_cost: Number(points_cost)
    };

    try {
      let res;
      if (id) {
        res = await fetch(`/api/rewards/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-parent-token': parentToken
          },
          body: JSON.stringify(body)
        });
      } else {
        res = await fetch('/api/rewards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-parent-token': parentToken
          },
          body: JSON.stringify(body)
        });
      }

      if (res.ok) {
        setIsRewardModalOpen(false);
        fetchResources();
      }
    } catch (err) {
      console.error('Error saving reward:', err);
    }
  };

  const handleDeleteReward = async (id) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;
    try {
      const res = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE',
        headers: { 'x-parent-token': parentToken }
      });
      if (res.ok) fetchResources();
    } catch (err) {
      console.error('Error deleting reward:', err);
    }
  };

  // Kid Adjustments Handlers
  const handleOpenAdjustment = (kid) => {
    setAdjustmentForm({ kidId: kid.id, kidName: kid.name, amount: 0 });
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    const { kidId, amount } = adjustmentForm;
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;

    const newPoints = Math.max(0, kid.points + Number(amount));

    try {
      const res = await fetch(`/api/kids/${kidId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-token': parentToken
        },
        body: JSON.stringify({ points: newPoints })
      });
      if (res.ok) {
        setIsAdjustmentModalOpen(false);
        onReloadKids();
      }
    } catch (err) {
      console.error('Error adjusting kid gold balance:', err);
    }
  };

  // Kid Profile Edit Handlers
  const handleOpenKidEdit = async (kid) => {
    setEditError('');
    try {
      const res = await fetch(`/api/kids/${kid.id}`, {
        headers: { 'x-parent-token': parentToken }
      });
      if (res.ok) {
        const fullKid = await res.json();
        setKidEditForm({
          id: fullKid.id,
          name: fullKid.name,
          avatar: fullKid.avatar,
          color_theme: fullKid.color_theme,
          pin: fullKid.pin || ''
        });
        setIsKidEditModalOpen(true);
      } else {
        console.error('Failed to fetch full kid profile details.');
      }
    } catch (err) {
      console.error('Error fetching kid details:', err);
    }
  };

  const handleKidEditSubmit = async (e) => {
    e.preventDefault();
    const { id, name, avatar, color_theme, pin } = kidEditForm;

    if (!name.trim()) {
      setEditError('Name is required.');
      return;
    }

    try {
      const res = await fetch(`/api/kids/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-token': parentToken
        },
        body: JSON.stringify({
          name: name.trim(),
          avatar,
          color_theme,
          pin
        })
      });

      if (res.ok) {
        setIsKidEditModalOpen(false);
        onReloadKids();
      } else {
        const errData = await res.json();
        setEditError(errData.error || 'Failed to update kid profile.');
      }
    } catch (err) {
      console.error('Error updating kid profile:', err);
      setEditError('Connection error. Try again!');
    }
  };

  return (
    <div className="theme-parent" style={{ width: '100%' }}>
      {/* Top command panel banner */}
      <div className="glass-panel active-theme-card" style={{ marginBottom: '2.5rem', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={36} style={{ color: 'var(--theme-parent)' }} />
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Guild Master Control</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Parents command panel to verify quests and dispense loot.</p>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={onBackToProfiles}>
            Exit Parent Mode
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('approvals')}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <Clock size={16} /> Approval Inbox
          {(pendingCompletions.length + pendingRedemptions.length) > 0 && (
            <span style={{
              background: 'var(--theme-rose)',
              color: '#ffffff',
              borderRadius: '99px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.7rem',
              fontWeight: 700
            }}>
              {pendingCompletions.length + pendingRedemptions.length}
            </span>
          )}
        </button>

        <button
          className={`btn ${activeTab === 'chores' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('chores')}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <Sword size={16} /> Quest Editor
        </button>

        <button
          className={`btn ${activeTab === 'rewards' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('rewards')}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <Gift size={16} /> Loot Manager
        </button>

        <button
          className={`btn ${activeTab === 'kids' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('kids')}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <UserPlus size={16} /> Heroes (Kids)
        </button>
      </div>

      {/* ==================== 1. APPROVALS TAB ==================== */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Chore Approvals Queue */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚔️ Quest Verifications ({pendingCompletions.length})
            </h3>

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
                          <span className={`badge badge-pending`}>Pending</span>
                        </div>
                        <h4 style={{ fontSize: '1.1rem', margin: '0.2rem 0', fontWeight: 600 }}>{completion.chore_title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Submitted: {new Date(completion.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({completion.completed_date})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ color: 'var(--theme-amber)', fontWeight: 700, fontSize: '1.1rem' }}>
                        🪙 +{completion.chore_points} Gold
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 0.75rem', borderColor: 'var(--theme-rose-border)', color: 'var(--theme-rose)' }}
                          onClick={() => handleOpenRejection(completion.id)}
                        >
                          <X size={16} /> Reject
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 0.75rem', background: 'var(--theme-emerald)', color: 'var(--text-dark)' }}
                          onClick={() => handleApproveChore(completion.id, completion.kid_name, completion.chore_points)}
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
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                          <span className={`badge badge-approved`}>Purchased</span>
                        </div>
                        <h4 style={{ fontSize: '1.1rem', margin: '0.2rem 0', fontWeight: 600 }}>{redemption.reward_title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Redeemed: {new Date(redemption.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ color: 'var(--theme-amber)', fontWeight: 700, fontSize: '1.1rem' }}>
                        🪙 -{redemption.reward_cost} Gold (Deducted)
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', background: 'var(--theme-parent)', color: 'var(--text-white)' }}
                        onClick={() => handleFulfillRedemption(redemption.id)}
                      >
                        <Check size={16} /> Deliver Loot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================== 2. CHORES TAB ==================== */}
      {activeTab === 'chores' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Active Quest Board (Chores)</h3>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleOpenChoreCreate}>
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
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', textTransform: 'uppercase', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        {chore.schedule_type === 'alternate' ? 'every other day' : chore.schedule_type}
                      </span>
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {chore.description || 'No description provided.'}
                    </p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent, var(--theme-violet))', fontWeight: 500, marginTop: '0.25rem', display: 'inline-block' }}>
                      Assigned To: {chore.assigned_to_name ? `${chore.assigned_to_avatar} ${chore.assigned_to_name}` : '🌎 Everyone'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--theme-amber)', fontWeight: 700 }}>
                      🪙 {chore.points} Gold
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleOpenChoreEdit(chore)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--theme-rose)' }} onClick={() => handleDeleteChore(chore.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== 3. REWARDS TAB ==================== */}
      {activeTab === 'rewards' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Loot Vault Stock (Rewards)</h3>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleOpenRewardCreate}>
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
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {reward.description || 'No description provided.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--theme-amber)', fontWeight: 700 }}>
                      🪙 {reward.points_cost} Gold
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleOpenRewardEdit(reward)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--theme-rose)' }} onClick={() => handleDeleteReward(reward.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== 4. KIDS TAB ==================== */}
      {activeTab === 'kids' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Factions & Heroes (Children Profiles)</h3>

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
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.2rem',
                    border: '2px solid var(--accent)'
                  }}>
                    {kid.avatar}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{kid.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                      Level {Math.floor(kid.points / 100) + 1} Hero (Theme: {kid.color_theme})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                    <Coins size={18} style={{ color: 'var(--theme-amber)' }} />
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{kid.points}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gold</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => handleOpenKidEdit(kid)}>
                      <Edit3 size={16} /> Edit Profile
                    </button>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => handleOpenAdjustment(kid)}>
                      <Coins size={16} /> Adjust Gold
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quest Editor Modal */}
      {isChoreModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content theme-parent">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sword size={20} /> {choreForm.id ? 'Edit Quest Details' : 'Forge New Quest'}
              </h3>
              <button className="modal-close" onClick={() => setIsChoreModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleChoreFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div className="input-group">
                <span className="input-label">Quest Title (Chore Name)</span>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g., Vacuum the living room"
                  value={choreForm.title}
                  onChange={(e) => setChoreForm({ ...choreForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Description (Instructions)</span>
                <textarea
                  className="glass-textarea"
                  rows={3}
                  placeholder="Provide clear steps for full coins..."
                  value={choreForm.description}
                  onChange={(e) => setChoreForm({ ...choreForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <span className="input-label">Gold Value</span>
                  <input
                    type="number"
                    className="glass-input"
                    min={0}
                    max={1000}
                    value={choreForm.points}
                    onChange={(e) => setChoreForm({ ...choreForm, points: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group" style={{ flex: 1 }}>
                  <span className="input-label">Assignee Hero</span>
                  <select
                    className="glass-select"
                    value={choreForm.assigned_to}
                    onChange={(e) => setChoreForm({ ...choreForm, assigned_to: e.target.value })}
                  >
                    <option value="">🌎 Everyone (Public Quest)</option>
                    {kids.map(kid => (
                      <option key={kid.id} value={kid.id}>{kid.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Schedule Cycle</span>
                <select
                  className="glass-select"
                  value={choreForm.schedule_type}
                  onChange={(e) => setChoreForm({ ...choreForm, schedule_type: e.target.value })}
                >
                  <option value="daily">📅 Daily (Repeats Every Day)</option>
                  <option value="weekly">📆 Weekly (Checkoff Once a Week)</option>
                  <option value="alternate">🔄 Alternate Days (Every Other Day)</option>
                  <option value="custom">🛠️ Custom Days (Mon/Wed/Fri, etc.)</option>
                </select>
              </div>

              {choreForm.schedule_type === 'custom' && (
                <div className="input-group">
                  <span className="input-label">Active Weekdays (Comma-Separated Indices: 0-Sun to 6-Sat)</span>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. 1,3,5 for Mon/Wed/Fri"
                    value={choreForm.schedule_days}
                    onChange={(e) => setChoreForm({ ...choreForm, schedule_days: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsChoreModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loot Editor Modal */}
      {isRewardModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content theme-parent">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gift size={20} /> {rewardForm.id ? 'Edit Loot Item' : 'Create New Loot Reward'}
              </h3>
              <button className="modal-close" onClick={() => setIsRewardModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleRewardFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div className="input-group">
                <span className="input-label">Loot Name (Reward Title)</span>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g., Ice Cream Treat"
                  value={rewardForm.title}
                  onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Loot Description</span>
                <textarea
                  className="glass-textarea"
                  rows={3}
                  placeholder="e.g. A family night trip to get double scoops..."
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Gold Cost (Coins Required)</span>
                <input
                  type="number"
                  className="glass-input"
                  min={1}
                  max={5000}
                  value={rewardForm.points_cost}
                  onChange={(e) => setRewardForm({ ...rewardForm, points_cost: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsRewardModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Forge Loot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Feedback Prompt */}
      {rejectionFeedback.completionId && (
        <div className="modal-overlay">
          <div className="glass-card modal-content theme-parent">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem', color: 'var(--theme-rose)' }}>Revision Instructions</h3>
              <button className="modal-close" onClick={() => setRejectionFeedback({ completionId: null, feedback: '' })}>✕</button>
            </div>
            <form onSubmit={handleRejectChore} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                Help the hero understand what needs to be improved in their work before they claim the gold coins.
              </p>

              <div className="input-group">
                <span className="input-label">Feedback Notes</span>
                <textarea
                  className="glass-textarea"
                  rows={3}
                  placeholder="e.g. Please put away your shoes in the closet as well."
                  value={rejectionFeedback.feedback}
                  onChange={(e) => setRejectionFeedback({ ...rejectionFeedback, feedback: e.target.value })}
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

      {/* Gold Adjustments Modal */}
      {isAdjustmentModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content theme-parent">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem' }}>
                Adjust Gold Balance: {adjustmentForm.kidName}
              </h3>
              <button className="modal-close" onClick={() => setIsAdjustmentModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                You can manually add or deduct gold coins for this hero's balance. Use positive numbers to reward, negative numbers to penalize.
              </p>

              <div className="input-group">
                <span className="input-label">Adjustment Amount</span>
                <input
                  type="number"
                  className="glass-input"
                  placeholder="e.g., 50 or -50"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAdjustmentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Kid Profile Modal */}
      {isKidEditModalOpen && (
        <div className="modal-overlay">
          <div className={`glass-card modal-content theme-${kidEditForm.color_theme}`}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: `var(--theme-${kidEditForm.color_theme})` }} /> Edit Hero Profile
              </h3>
              <button className="modal-close" onClick={() => setIsKidEditModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleKidEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <span className="input-label">Hero Name</span>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Enter name..."
                  value={kidEditForm.name}
                  onChange={(e) => setKidEditForm({ ...kidEditForm, name: e.target.value })}
                  maxLength={15}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Choose Avatar Emoji</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {avatarsList.map(av => (
                    <button
                      key={av}
                      type="button"
                      className="glass-card"
                      style={{
                        padding: '0.5rem',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        borderColor: kidEditForm.avatar === av ? `var(--theme-${kidEditForm.color_theme})` : 'var(--card-border)',
                        background: kidEditForm.avatar === av ? `var(--theme-${kidEditForm.color_theme}-glow)` : 'transparent',
                        borderRadius: '12px'
                      }}
                      onClick={() => setKidEditForm({ ...kidEditForm, avatar: av })}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Accent Theme Color</span>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  {colorsList.map(col => (
                    <button
                      key={col}
                      type="button"
                      className={`btn theme-${col}`}
                      style={{
                        flex: 1,
                        background: `var(--theme-${col})`,
                        border: '3px solid',
                        borderColor: kidEditForm.color_theme === col ? '#ffffff' : 'transparent',
                        padding: '0.5rem',
                        borderRadius: '12px',
                        height: '24px'
                      }}
                      onClick={() => setKidEditForm({ ...kidEditForm, color_theme: col })}
                    />
                  ))}
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">PIN (4-Digits)</span>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="••••"
                  maxLength={4}
                  value={kidEditForm.pin}
                  onChange={(e) => setKidEditForm({ ...kidEditForm, pin: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              {editError && (
                <div style={{ color: 'var(--theme-rose)', fontSize: '0.9rem', textAlign: 'center' }}>
                  {editError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsKidEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
