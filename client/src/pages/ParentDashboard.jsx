import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Sword,
  Gift,
  Clock,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Import Modular Components
import KidsProgressTable from '../components/parent/KidsProgressTable';
import ApprovalsQueue from '../components/parent/ApprovalsQueue';
import ManageChoresTab from '../components/parent/ManageChoresTab';
import ManageRewardsTab from '../components/parent/ManageRewardsTab';
import ManageKidsTab from '../components/parent/ManageKidsTab';

// Import Modals
import ChoreModal from '../components/parent/Modals/ChoreModal';
import RewardModal from '../components/parent/Modals/RewardModal';
import AdjustmentModal from '../components/parent/Modals/AdjustmentModal';
import KidEditModal from '../components/parent/Modals/KidEditModal';
import FamilyPairingModal from '../components/pairing/FamilyPairingModal';

export default function ParentDashboard({ kids, parentToken, householdId, guildName, onBackToProfiles, onReloadKids }) {
  const [activeTab, setActiveTab] = useState('approvals'); // approvals, chores, rewards, kids
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);

  const [pendingCompletions, setPendingCompletions] = useState([]);
  const [pendingRedemptions, setPendingRedemptions] = useState([]);
  const [choresList, setChoresList] = useState([]);
  const [rewardsList, setRewardsList] = useState([]);
  const [kidsProgress, setKidsProgress] = useState({});
  const [kidsChores, setKidsChores] = useState({});

  // Modals & Selected items State
  const [isChoreModalOpen, setIsChoreModalOpen] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedKidForAdjustment, setSelectedKidForAdjustment] = useState(null);

  const [isKidEditModalOpen, setIsKidEditModalOpen] = useState(false);
  const [selectedKidForEdit, setSelectedKidForEdit] = useState(null);
  const [editError, setEditError] = useState('');

  // Load backend queues and resources
  useEffect(() => {
    fetchQueues();
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (kids && kids.length > 0) {
      const today = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

      Promise.all(
        kids.map(async (kid) => {
          try {
            const res = await fetch(`/api/chores/daily/${kid.id}/${dateStr}`);
            if (res.ok) {
              const chores = await res.json();
              const completed = chores.filter(
                (c) => c.completion_status === 'approved' || c.completion_status === 'pending'
              ).length;
              const approved = chores.filter((c) => c.completion_status === 'approved').length;
              const pending = chores.filter((c) => c.completion_status === 'pending').length;
              const total = chores.length;
              return { kidId: kid.id, completed, approved, pending, total, chores };
            }
          } catch (err) {
            console.error(`Error fetching progress for kid ${kid.id}:`, err);
          }
          return { kidId: kid.id, completed: 0, approved: 0, pending: 0, total: 0, chores: [] };
        })
      ).then((results) => {
        const progressMap = {};
        const choresMap = {};
        results.forEach((r) => {
          progressMap[r.kidId] = {
            completed: r.completed,
            approved: r.approved,
            pending: r.pending,
            total: r.total
          };
          choresMap[r.kidId] = r.chores;
        });
        setKidsProgress(progressMap);
        setKidsChores(choresMap);
      });
    }
  }, [kids, pendingCompletions]);

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
  const handleApproveChore = async (id, _kidName, _points) => {
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

  // Approve all chores
  const handleApproveAllChores = async () => {
    try {
      const res = await fetch('/api/completions/approve-all', {
        method: 'PUT',
        headers: { 'x-parent-token': parentToken }
      });
      if (res.ok) {
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
      console.error('Error approving chores:', err);
    }
  };

  // Reject chore completion
  const handleRejectChore = async (id, feedback) => {
    try {
      const res = await fetch(`/api/completions/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-token': parentToken
        },
        body: JSON.stringify({ feedback: feedback || 'Please redo this task.' })
      });
      if (res.ok) {
        fetchQueues();
      }
    } catch (err) {
      console.error('Error rejecting chore:', err);
    }
  };

  // Reject all chore completions
  const handleRejectAllChores = async () => {
    try {
      const res = await fetch('/api/completions/reject-all', {
        method: 'PUT',
        headers: { 'x-parent-token': parentToken }
      });
      if (res.ok) {
        fetchQueues();
      }
    } catch (err) {
      console.error('Error rejecting all chores:', err);
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
    setSelectedChore(null);
    setIsChoreModalOpen(true);
  };

  const handleOpenChoreEdit = (chore) => {
    setSelectedChore(chore);
    setIsChoreModalOpen(true);
  };

  const handleChoreFormSubmit = async (form) => {
    const { id, title, description, points, schedule_type, schedule_days, assigned_to } = form;

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
    setSelectedReward(null);
    setIsRewardModalOpen(true);
  };

  const handleOpenRewardEdit = (reward) => {
    setSelectedReward(reward);
    setIsRewardModalOpen(true);
  };

  const handleRewardFormSubmit = async (form) => {
    const { id, title, description, points_cost } = form;

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
    setSelectedKidForAdjustment(kid);
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustmentSubmit = async (amount) => {
    if (!selectedKidForAdjustment) return;
    const newPoints = Math.max(0, selectedKidForAdjustment.points + amount);

    try {
      const res = await fetch(`/api/kids/${selectedKidForAdjustment.id}`, {
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
        setSelectedKidForEdit(fullKid);
        setIsKidEditModalOpen(true);
      } else {
        console.error('Failed to fetch full kid profile details.');
      }
    } catch (err) {
      console.error('Error fetching kid details:', err);
    }
  };

  const handleKidEditSubmit = async (form) => {
    const { id, name, avatar, color_theme, pin } = form;

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
      <div
        className="glass-panel active-theme-card"
        style={{ marginBottom: '2.5rem', padding: '1.5rem 2rem' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={36} style={{ color: 'var(--theme-parent)' }} />
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Guild Master Control</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Parents command panel to verify quests and dispense loot.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={() => setIsPairingModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <QrCode size={16} /> Link Devices &amp; Backup
            </button>
            <button className="btn btn-secondary" onClick={onBackToProfiles}>
              Exit Parent Mode
            </button>
          </div>
        </div>
      </div>

      {/* Kids Progress Table */}
      <KidsProgressTable
        kids={kids}
        kidsProgress={kidsProgress}
        kidsChores={kidsChores}
        onOpenKidEdit={handleOpenKidEdit}
        onOpenAdjustment={handleOpenAdjustment}
      />

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('approvals')}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <Clock size={16} /> Approval Inbox
          {pendingCompletions.length + pendingRedemptions.length > 0 && (
            <span
              style={{
                background: 'var(--theme-rose)',
                color: '#ffffff',
                borderRadius: '99px',
                padding: '0.1rem 0.4rem',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
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

      {/* Tab Render Area */}
      {activeTab === 'approvals' && (
        <ApprovalsQueue
          pendingCompletions={pendingCompletions}
          pendingRedemptions={pendingRedemptions}
          onApproveCompletion={handleApproveChore}
          onApproveAllCompletions={handleApproveAllChores}
          onRejectCompletion={handleRejectChore}
          onRejectAllCompletions={handleRejectAllChores}
          onFulfillRedemption={handleFulfillRedemption}
        />
      )}

      {activeTab === 'chores' && (
        <ManageChoresTab
          choresList={choresList}
          onOpenChoreAdd={handleOpenChoreCreate}
          onOpenChoreEdit={handleOpenChoreEdit}
          onDeleteChore={handleDeleteChore}
        />
      )}

      {activeTab === 'rewards' && (
        <ManageRewardsTab
          rewardsList={rewardsList}
          onOpenRewardAdd={handleOpenRewardCreate}
          onOpenRewardEdit={handleOpenRewardEdit}
          onDeleteReward={handleDeleteReward}
        />
      )}

      {activeTab === 'kids' && (
        <ManageKidsTab
          kids={kids}
          onOpenKidEdit={handleOpenKidEdit}
          onOpenAdjustment={handleOpenAdjustment}
        />
      )}

      {/* Modals Rendering */}
      <ChoreModal
        isOpen={isChoreModalOpen}
        onClose={() => setIsChoreModalOpen(false)}
        chore={selectedChore}
        kids={kids}
        onSubmit={handleChoreFormSubmit}
      />

      <RewardModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        reward={selectedReward}
        onSubmit={handleRewardFormSubmit}
      />

      <AdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        kid={selectedKidForAdjustment}
        onSubmit={handleAdjustmentSubmit}
      />

      <KidEditModal
        isOpen={isKidEditModalOpen}
        onClose={() => setIsKidEditModalOpen(false)}
        kid={selectedKidForEdit}
        editError={editError}
        onSubmit={handleKidEditSubmit}
      />

      <FamilyPairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        householdId={householdId}
        guildName={guildName}
        parentToken={parentToken}
      />
    </div>
  );
}
