import React, { useState } from 'react';
import { ShieldCheck, Plus, QrCode } from 'lucide-react';
import { useThemePack } from '../context/ThemePackContext';

// Import modular components
import ProfilePinModal from '../components/profile/ProfilePinModal';
import AddHeroModal from '../components/profile/AddHeroModal';
import JoinFamilyModal from '../components/pairing/JoinFamilyModal';

export default function ProfileSelect({ kids, onSelectKid, onSelectParent, onAddKid, onJoinSuccess }) {
  const { themePack } = useThemePack();
  const [pinModalKid, setPinModalKid] = useState(null);
  const [pinError, setPinError] = useState('');
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleProfileClick = (kid) => {
    setPinModalKid(kid);
    setPinError('');
  };

  const handleParentCommandClick = () => {
    setPinModalKid({ id: 'parent', name: 'Parents' });
    setPinError('');
  };

  const handlePinSubmit = async (pinInput) => {
    if (!pinInput) return;

    const storedHouseholdId = localStorage.getItem('cq_household_id');
    const storedDeviceToken = localStorage.getItem('cq_device_token');
    const authHeaders = {
      'Content-Type': 'application/json',
      ...(storedHouseholdId ? { 'x-household-id': storedHouseholdId } : {}),
      ...(storedDeviceToken ? { 'x-device-token': storedDeviceToken } : {})
    };

    if (pinModalKid.id === 'parent') {
      try {
        const res = await fetch('/api/verify-parent-pin', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ pin: pinInput })
        });
        if (res.ok) {
          const data = await res.json();
          onSelectParent(data.token);
          setPinModalKid(null);
        } else {
          if (res.status === 429) {
            const errData = await res.json();
            setPinError(errData.error);
          } else {
            setPinError('Invalid Parent PIN. Try again!');
          }
        }
      } catch (err) {
        setPinError('Connection error. Try again!');
      }
    } else {
      try {
        const res = await fetch(`/api/kids/${pinModalKid.id}/verify-pin`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ pin: pinInput })
        });
        if (res.ok) {
          onSelectKid(pinModalKid);
          setPinModalKid(null);
        } else {
          if (res.status === 429) {
            const errData = await res.json();
            setPinError(errData.error);
          } else {
            setPinError(`Incorrect PIN for ${pinModalKid.name}. Try again!`);
          }
        }
      } catch (err) {
        setPinError('Connection error. Try again!');
      }
    }
  };

  const handleCreateProfile = async (kidData) => {
    const result = await onAddKid(kidData);
    if (result) {
      setIsAddingProfile(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto 0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-display)'
          }}
        >
          Who is checking in today?
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {themePack?.memberSelectPrompt || 'Select your profile to check your daily tasks or rewards!'}
        </p>
      </div>

      <div className="kids-selection-grid">
        {kids.map((kid) => (
          <div
            key={kid.id}
            className={`glass-card profile-card theme-${kid.color_theme}`}
            onClick={() => handleProfileClick(kid)}
          >
            <div className="avatar-circle">{kid.avatar}</div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{kid.name}</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>
              {themePack?.currencyIcon || '⭐'} {kid.points} {themePack?.currencyName || 'Points'}
            </span>
          </div>
        ))}

        {/* Add Member Profile Card */}
        <div
          className="glass-card profile-card"
          style={{ borderStyle: 'dashed', opacity: 0.7 }}
          onClick={() => setIsAddingProfile(true)}
        >
          <div className="avatar-circle" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <Plus size={40} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            {themePack?.addMemberLabel || 'Add Member'}
          </h3>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Create Profile</span>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="user-badge theme-parent"
          onClick={handleParentCommandClick}
          style={{ padding: '0.75rem 1.75rem' }}
        >
          <ShieldCheck size={20} style={{ color: 'var(--theme-parent)' }} />
          <span className="user-name" style={{ fontSize: '1rem' }}>
            {themePack?.adminLabel || 'Parent Command'}
          </span>
        </button>

        <button
          className="btn btn-outline"
          onClick={() => setIsJoinModalOpen(true)}
          style={{ padding: '0.75rem 1.25rem', borderRadius: '12px' }}
        >
          <QrCode size={18} />
          <span>Link Device</span>
        </button>
      </div>

      {/* PIN Verification Modal */}
      <ProfilePinModal
        isOpen={!!pinModalKid}
        onClose={() => setPinModalKid(null)}
        pinModalKid={pinModalKid}
        pinError={pinError}
        onSubmit={handlePinSubmit}
      />

      {/* Add Hero Modal */}
      <AddHeroModal
        isOpen={isAddingProfile}
        onClose={() => setIsAddingProfile(false)}
        onSubmit={handleCreateProfile}
      />

      {/* Join / Pair Modal */}
      <JoinFamilyModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinSuccess={(data) => {
          if (onJoinSuccess) onJoinSuccess(data);
          else window.location.reload();
        }}
      />
    </div>
  );
}

