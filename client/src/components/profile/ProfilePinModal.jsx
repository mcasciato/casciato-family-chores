import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ProfilePinModal({ isOpen, onClose, pinModalKid, pinError, onSubmit }) {
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
    }
  }, [isOpen]);

  if (!isOpen || !pinModalKid) return null;

  const handleSubmitSubmit = (e) => {
    e.preventDefault();
    onSubmit(pinInput);
  };

  const isParent = pinModalKid.id === 'parent';

  return (
    <div className="modal-overlay">
      <div className={`glass-card modal-content theme-${isParent ? 'parent' : pinModalKid.color_theme}`}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isParent ? (
              <>
                <ShieldCheck /> Parent Mode Access
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.5rem' }}>{pinModalKid.avatar}</span> Unlock{' '}
                {pinModalKid.name}'s Profile
              </>
            )}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form
          onSubmit={handleSubmitSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            {isParent
              ? 'Please enter a 4-digit PIN to authenticate as a parent.'
              : `Please enter your 4-digit PIN to unlock ${pinModalKid.name}'s quest dashboard.`}
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
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
