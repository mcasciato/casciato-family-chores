import React, { useState, useEffect } from 'react';
import { LogOut, CheckSquare, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useThemePack } from '../context/ThemePackContext';

// Import modular components
import QuestsTab from '../components/kid/QuestsTab';
import LootShopTab from '../components/kid/LootShopTab';

export default function KidDashboard({ kid, onBackToProfiles, onUpdateKidPoints }) {
  const { themePack } = useThemePack();
  const [chores, setChores] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [activeTab, setActiveTab] = useState('quests'); // 'quests' or 'loot'
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Format today's date for standard visual and database tracking
  useEffect(() => {
    const today = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    setDateStr(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
  }, []);

  // Fetch chores and rewards
  useEffect(() => {
    if (dateStr) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch chores for today
      const choresRes = await fetch(`/api/chores/daily/${kid.id}/${dateStr}`);
      const choresData = await choresRes.json();
      setChores(choresData);

      // 2. Fetch rewards
      const rewardsRes = await fetch('/api/rewards');
      const rewardsData = await rewardsRes.json();
      setRewards(rewardsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChore = async (choreId) => {
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chore_id: choreId,
          kid_id: kid.id,
          completed_date: dateStr
        })
      });

      if (res.ok) {
        // Trigger a tiny success confetti pop for kids when they submit a quest!
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#8b5cf6']
        });

        setSuccessMessage(`${themePack?.taskSingle || 'Task'} completed! Waiting for parent approval.`);
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit task.');
      }
    } catch (err) {
      console.error('Error submitting completion:', err);
    }
  };

  const handleRedeemReward = async (reward) => {
    if (kid.points < reward.points_cost) return;

    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reward_id: reward.id,
          kid_id: kid.id
        })
      });

      if (res.ok) {
        // Big confetti explosion for reward redemption!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981']
        });

        // Update the kid's points inside parent state
        const newPoints = kid.points - reward.points_cost;
        onUpdateKidPoints(newPoints);

        setSuccessMessage(`Reward requested: "${reward.title}"! Parents will fulfill it soon.`);
        setTimeout(() => setSuccessMessage(''), 5000);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to redeem reward.');
      }
    } catch (err) {
      console.error('Error redeeming reward:', err);
    }
  };

  // Compute stats
  const completedToday = chores.filter(
    (c) => c.completion_status === 'approved' || c.completion_status === 'pending'
  ).length;
  const totalChores = chores.length;
  const percentCompleted = totalChores > 0 ? Math.round((completedToday / totalChores) * 100) : 0;

  return (
    <div className={`theme-${kid.color_theme}`} style={{ width: '100%' }}>
      {/* Top Banner Profile Summary */}
      <div
        className="glass-panel active-theme-card"
        style={{ marginBottom: '2.5rem', padding: '1.75rem 2rem' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.75rem',
                border: '2px solid var(--accent)'
              }}
            >
              {kid.avatar}
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Welcome, {kid.name}!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.15rem' }}>
                Level {Math.floor(kid.points / 100) + 1} {themePack?.memberLabel || 'Member'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div
              className="glass-card"
              style={{
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>{themePack?.currencyIcon || '⭐'}</span>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{kid.points}</div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}
                >
                  {themePack?.currencyName || 'Points'}
                </div>
              </div>
            </div>

            <button className="btn btn-secondary" onClick={onBackToProfiles}>
              <LogOut size={16} /> Switch Profile
            </button>
          </div>
        </div>

        {/* Progress Tracker bar */}
        {totalChores > 0 && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                marginBottom: '0.5rem',
                fontWeight: 600
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>TODAY'S PROGRESS</span>
              <span style={{ color: 'var(--accent)' }}>
                {completedToday}/{totalChores} {themePack?.tasksTab || 'Tasks'} ({percentCompleted}%)
              </span>
            </div>
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${percentCompleted}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </div>
        )}
      </div>

      {successMessage && (
        <div
          className="glass-card"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'var(--theme-emerald)',
            color: 'var(--text-white)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center',
            fontWeight: 500,
            animation: 'fadeIn 0.3s'
          }}
        >
          ✨ {successMessage}
        </div>
      )}

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'quests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('quests')}
          style={{ flex: 1, padding: '1rem' }}
        >
          <CheckSquare size={20} /> {themePack?.tasksTab || 'Tasks'} ({chores.length})
        </button>
        <button
          className={`btn ${activeTab === 'loot' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('loot')}
          style={{ flex: 1, padding: '1rem' }}
        >
          <Gift size={20} /> {themePack?.rewardsTab || 'Rewards'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'scaleIn 1s infinite linear',
              margin: '0 auto 1rem auto'
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading active campaign data...</p>
        </div>
      ) : activeTab === 'quests' ? (
        <QuestsTab chores={chores} onCompleteChore={handleCompleteChore} />
      ) : (
        <LootShopTab rewards={rewards} kidPoints={kid.points} onRedeemReward={handleRedeemReward} />
      )}
    </div>
  );
}
