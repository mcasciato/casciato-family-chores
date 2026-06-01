import React, { useState } from 'react';
import { ShieldCheck, Plus, Sparkles } from 'lucide-react';

export default function ProfileSelect({ kids, onSelectKid, onSelectParent, onAddKid }) {
  const [pinModalKid, setPinModalKid] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAvatar, setNewKidAvatar] = useState('🧙‍♂️');
  const [newKidColor, setNewKidColor] = useState('violet');
  const [newKidPin, setNewKidPin] = useState('');

  const handleProfileClick = (kid) => {
    // Open Pin Modal for the selected kid!
    setPinModalKid(kid);
    setPinInput('');
    setPinError('');
  };

  const handleParentCommandClick = () => {
    // Open Pin Modal representing "Parent Mode"
    setPinModalKid({ id: 'parent', name: 'Parents' });
    setPinInput('');
    setPinError('');
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput) return;

    if (pinModalKid.id === 'parent') {
      // Parents command: verify against backend verify-parent-pin
      try {
        const res = await fetch('/api/verify-parent-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      // Kids mode: verify kid's specific PIN
      try {
        const res = await fetch(`/api/kids/${pinModalKid.id}/verify-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newKidName.trim()) return;

    const result = await onAddKid({
      name: newKidName,
      avatar: newKidAvatar,
      color_theme: newKidColor,
      pin: newKidPin || '1234'
    });

    if (result) {
      setIsAddingProfile(false);
      setNewKidName('');
      setNewKidPin('');
    }
  };

  const avatars = ['🧙‍♂️', '🧝‍♀️', '🦁', '🐱', '🦄', '🦖', '🚀', '🐼', '🦊', '🎨', '⚽️', '🎸'];
  const colors = ['violet', 'amber', 'emerald', 'rose', 'blue'];

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto 0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
          Who is playing today?
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Select your profile to check your Quests or claim your Loot!</p>
      </div>

      <div className="kids-selection-grid">
        {kids.map((kid) => (
          <div
            key={kid.id}
            className={`glass-card profile-card theme-${kid.color_theme}`}
            onClick={() => handleProfileClick(kid)}
          >
            <div className="avatar-circle">
              {kid.avatar}
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{kid.name}</h3>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>
              🪙 {kid.points} Gold
            </span>
          </div>
        ))}

        {/* Add Hero Profile Card */}
        <div
          className="glass-card profile-card"
          style={{ borderStyle: 'dashed', opacity: 0.7 }}
          onClick={() => setIsAddingProfile(true)}
        >
          <div className="avatar-circle" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <Plus size={40} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Add Hero</h3>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Create Profile</span>
        </div>
      </div>

      {/* Parent Command Center Section */}
      <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center' }}>
        <button className="user-badge theme-parent" onClick={handleParentCommandClick} style={{ padding: '0.75rem 1.75rem' }}>
          <ShieldCheck size={20} style={{ color: 'var(--theme-parent)' }} />
          <span className="user-name" style={{ fontSize: '1rem' }}>Parent Command Center</span>
        </button>
      </div>

      {/* PIN Verification Modal */}
      {pinModalKid && (
        <div className="modal-overlay">
          <div className={`glass-card modal-content theme-${pinModalKid.id === 'parent' ? 'parent' : pinModalKid.color_theme}`}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {pinModalKid.id === 'parent' ? (
                  <>
                    <ShieldCheck /> Parent Mode Access
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.5rem' }}>{pinModalKid.avatar}</span> Unlock {pinModalKid.name}'s Profile
                  </>
                )}
              </h3>
              <button className="modal-close" onClick={() => setPinModalKid(null)}>✕</button>
            </div>
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                {pinModalKid.id === 'parent'
                  ? 'Please enter a 4-digit PIN to authenticate as a parent.'
                  : `Please enter your 4-digit PIN to unlock ${pinModalKid.name}'s quest dashboard.`
                }
              </p>
              
              <div className="input-group">
                <input
                  type="password"
                  className="glass-input"
                  placeholder="••••"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em' }}
                  autoFocus
                />
              </div>

              {pinError && (
                <div style={{ color: 'var(--theme-rose)', fontSize: '0.9rem', textAlign: 'center' }}>
                  {pinError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPinModalKid(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hero Modal */}
      {isAddingProfile && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--theme-violet)' }} /> Summon New Hero
              </h3>
              <button className="modal-close" onClick={() => setIsAddingProfile(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <span className="input-label">Hero Name</span>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Enter name..."
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Choose Avatar Emoji</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {avatars.map(av => (
                    <button
                      key={av}
                      type="button"
                      className="glass-card"
                      style={{
                        padding: '0.5rem',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        borderColor: newKidAvatar === av ? 'var(--theme-violet)' : 'var(--card-border)',
                        background: newKidAvatar === av ? 'var(--theme-violet-glow)' : 'transparent',
                        borderRadius: '12px'
                      }}
                      onClick={() => setNewKidAvatar(av)}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Accent Theme Color</span>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  {colors.map(col => (
                    <button
                      key={col}
                      type="button"
                      className={`btn theme-${col}`}
                      style={{
                        flex: 1,
                        background: `var(--theme-${col})`,
                        border: '3px solid',
                        borderColor: newKidColor === col ? '#ffffff' : 'transparent',
                        padding: '0.5rem',
                        borderRadius: '12px',
                        height: '24px'
                      }}
                      onClick={() => setNewKidColor(col)}
                    />
                  ))}
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Parent mode PIN (4-Digits)</span>
                <input
                  type="password"
                  className="glass-input"
                  placeholder="1234"
                  maxLength={4}
                  value={newKidPin}
                  onChange={(e) => setNewKidPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddingProfile(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Summon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
