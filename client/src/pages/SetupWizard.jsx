import React, { useState } from 'react';
import { Crown } from 'lucide-react';

// Import modular components
import SetupGuildStep from '../components/setup/SetupGuildStep';
import SetupHeroStep from '../components/setup/SetupHeroStep';

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

        {/* Step Views */}
        {step === 1 ? (
          <SetupGuildStep
            guildName={guildName}
            setGuildName={setGuildName}
            parentPin={parentPin}
            setParentPin={setParentPin}
            parentPinConfirm={parentPinConfirm}
            setParentPinConfirm={setParentPinConfirm}
            onNext={handleNextStep}
          />
        ) : (
          <SetupHeroStep
            kidName={kidName}
            setKidName={setKidName}
            kidPin={kidPin}
            setKidPin={setKidPin}
            kidTheme={kidTheme}
            setKidTheme={setKidTheme}
            kidAvatar={kidAvatar}
            setKidAvatar={setKidAvatar}
            avatars={avatars}
            themes={themes}
            loading={loading}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
