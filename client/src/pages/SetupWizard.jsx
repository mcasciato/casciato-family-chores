import React, { useState } from 'react';
import { ShieldCheck, Sparkles, User, Sword, Shield, Crown } from 'lucide-react';

export default function SetupWizard({ onSetupComplete }) {
  const [step, setStep] = useState(1);
  const [guildName, setGuildName] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [parentPinConfirm, setParentPinConfirm] = useState('');

  const [kidName, setKidName] = useState('');
  const [kidPin, setKidPin] = useState('');
  const [kidTheme, setKidTheme] = useState('violet');
  const [kidAvatar, setKidAvatar] = useState('⚔️');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatars = ['⚔️', '🛡️', '🚀', '🦄', '🦖', '🦁', '🐼', '🦊', '🧙‍♂️', '🧝‍♀️'];
  const themes = [
    { name: 'violet', class: 'from-purple-500 to-indigo-600', color: '#7c3aed' },
    { name: 'blue', class: 'from-blue-500 to-cyan-600', color: '#0ea5e9' },
    { name: 'rose', class: 'from-rose-500 to-pink-600', color: '#f43f5e' },
    { name: 'emerald', class: 'from-emerald-500 to-teal-600', color: '#10b981' },
    { name: 'amber', class: 'from-amber-500 to-orange-600', color: '#f59e0b' }
  ];

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!guildName.trim()) {
        setError('Please enter a name for your Family Guild!');
        return;
      }
      if (parentPin.length !== 4 || !/^\d+$/.test(parentPin)) {
        setError('Parent PIN must be exactly 4 digits.');
        return;
      }
      if (parentPin !== parentPinConfirm) {
        setError('Parent PINs do not match.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!kidName.trim()) {
      setError("Please enter your Hero's name!");
      return;
    }
    if (kidPin.length !== 4 || !/^\d+$/.test(kidPin)) {
      setError("Hero's PIN must be exactly 4 digits.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guild_name: guildName.trim(),
          parent_pin: parentPin,
          kid: {
            name: kidName.trim(),
            avatar: kidAvatar,
            color_theme: kidTheme,
            pin: kidPin
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete setup wizard.');
      }

      onSetupComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        {/* Header */}
        <div className="setup-header">
          <div className="logo-badge">
            <Crown className="logo-icon" size={32} />
          </div>
          <h1>ChoreQuest</h1>
          <p className="subtitle">First-Time Guild Setup</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. The Guild</div>
          <div className="progress-line">
            <div className={`progress-line-fill ${step === 2 ? 'full' : ''}`} />
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. First Hero</div>
        </div>

        {error && <div className="setup-error-badge">{error}</div>}

        {/* Step 1: Guild setup */}
        {step === 1 && (
          <div className="setup-form-step">
            <h2>🛡️ Configure Your Guild</h2>
            <p className="description">
              Name your household's Guild and set a secure 4-digit Parent PIN to access settings and
              approve chores.
            </p>

            <div className="input-group">
              <label>Guild Name</label>
              <input
                type="text"
                placeholder="e.g., Casciato Guild"
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
              />
            </div>

            <div className="pin-inputs-row">
              <div className="input-group flex-1">
                <label>Parent PIN (4 digits)</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={parentPin}
                  onChange={(e) => setParentPin(e.target.value)}
                />
              </div>
              <div className="input-group flex-1">
                <label>Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={parentPinConfirm}
                  onChange={(e) => setParentPinConfirm(e.target.value)}
                />
              </div>
            </div>

            <button className="btn-setup-next" onClick={handleNextStep}>
              Continue to Hero Setup <Sparkles size={16} />
            </button>
          </div>
        )}

        {/* Step 2: First Kid setup */}
        {step === 2 && (
          <div className="setup-form-step">
            <h2>⚔️ Summon Your First Hero</h2>
            <p className="description">
              Create a profile for your first child. They will log in using their own 4-digit PIN to
              check off chores and earn coins!
            </p>

            <div className="input-group">
              <label>Hero's Name</label>
              <input
                type="text"
                placeholder="e.g., Mac"
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Hero PIN (4 digits)</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={kidPin}
                onChange={(e) => setKidPin(e.target.value)}
              />
            </div>

            {/* Avatar Selector */}
            <div className="input-group">
              <label>Select Avatar Icon</label>
              <div className="setup-avatar-grid">
                {avatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    className={`setup-avatar-btn ${kidAvatar === av ? 'selected' : ''}`}
                    onClick={() => setKidAvatar(av)}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="input-group">
              <label>Choose Color Theme</label>
              <div className="setup-theme-row">
                {themes.map((th) => (
                  <button
                    key={th.name}
                    type="button"
                    className={`setup-theme-btn bg-grad-${th.name} ${kidTheme === th.name ? 'selected' : ''}`}
                    onClick={() => setKidTheme(th.name)}
                    title={th.name}
                  ></button>
                ))}
              </div>
            </div>

            <div className="setup-buttons-row">
              <button className="btn-setup-back" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="btn-setup-submit"
                type="button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Initializing Guild...' : 'Complete Onboarding! 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
