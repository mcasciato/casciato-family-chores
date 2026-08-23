import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Copy, Check, ArrowRight } from 'lucide-react';
import QRCode from 'qrcode';

// Import modular components
import SetupVibeStep from '../components/setup/SetupVibeStep';
import SetupGuildStep from '../components/setup/SetupGuildStep';
import SetupHeroStep from '../components/setup/SetupHeroStep';
import JoinFamilyModal from '../components/pairing/JoinFamilyModal';
import { DEFAULT_THEME_PACK, getThemePack } from '../theme/themePacks';

export default function SetupWizard({ onSetupComplete }) {
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME_PACK);

  const [guildName, setGuildName] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [parentPinConfirm, setParentPinConfirm] = useState('');

  const [kidName, setKidName] = useState('');
  const [kidPin, setKidPin] = useState('');
  const [kidTheme, setKidTheme] = useState('violet');
  const [kidAvatar, setKidAvatar] = useState('🦊');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdData, setCreatedData] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  const canvasRef = useRef(null);

  const currentThemePack = getThemePack(selectedTheme);
  const avatars = currentThemePack.avatars;

  const themes = [
    { name: 'violet', class: 'from-purple-500 to-indigo-600', color: '#7c3aed' },
    { name: 'blue', class: 'from-blue-500 to-cyan-600', color: '#0ea5e9' },
    { name: 'rose', class: 'from-rose-500 to-pink-600', color: '#f43f5e' },
    { name: 'emerald', class: 'from-emerald-500 to-teal-600', color: '#10b981' },
    { name: 'amber', class: 'from-amber-500 to-orange-600', color: '#f59e0b' }
  ];

  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId);
    const pack = getThemePack(themeId);
    if (pack.avatars && pack.avatars.length > 0) {
      setKidAvatar(pack.avatars[0]);
    }
  };

  useEffect(() => {
    if (step === 4 && createdData && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        JSON.stringify({ v: 1, type: 'recovery', hid: createdData.householdId, key: createdData.recoveryKey }),
        {
          width: 180,
          margin: 2,
          color: { dark: '#1e1b4b', light: '#ffffff' }
        },
        (err) => {
          if (err) console.error('Error generating QR:', err);
        }
      );
    }
  }, [step, createdData]);

  const handleStep1Next = () => {
    setStep(2);
  };

  const handleStep2Next = () => {
    setError('');
    if (!guildName.trim()) {
      setError(`Please enter a name for your ${currentThemePack.householdLabel}!`);
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
    setStep(3);
  };

  const handleSubmit = async () => {
    setError('');
    if (!kidName.trim()) {
      setError(`Please enter your ${currentThemePack.memberLabel}'s name!`);
      return;
    }
    if (kidPin.length !== 4 || !/^\d+$/.test(kidPin)) {
      setError(`${currentThemePack.memberLabel} PIN must be exactly 4 digits.`);
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
          theme_pack: selectedTheme,
          device_name: 'Master Parent Device',
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

      // Store in localStorage
      localStorage.setItem('cq_household_id', data.householdId);
      localStorage.setItem('cq_device_token', data.deviceToken);
      localStorage.setItem('cq_role', 'parent');
      localStorage.setItem('cq_guild_name', data.guildName);
      localStorage.setItem('cq_theme_pack', data.themePack || selectedTheme);

      setCreatedData(data);
      setStep(4); // Advance to Recovery Kit step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPhrase = () => {
    if (createdData?.recoveryKey) {
      navigator.clipboard.writeText(createdData.recoveryKey);
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 2000);
    }
  };

  const handleFinishSetup = () => {
    onSetupComplete(createdData);
  };

  const handleJoinSuccess = (data) => {
    onSetupComplete(data);
  };

  const recoveryWords = createdData?.recoveryKey ? createdData.recoveryKey.split(' ') : [];

  return (
    <div className="setup-container">
      <div className="setup-card">
        {/* Header */}
        <div className="setup-header">
          <div className="logo-badge">
            <span style={{ fontSize: '2rem' }}>{currentThemePack.icon}</span>
          </div>
          <h1>ChoreQuest</h1>
          <p className="subtitle">
            {step === 4 ? `${currentThemePack.householdLabel} Created!` : 'Family Setup Wizard'}
          </p>
        </div>

        {/* Progress Bar */}
        {step < 4 && (
          <div className="progress-bar-container">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Vibe</div>
            <div className="progress-line">
              <div className={`progress-line-fill ${step >= 2 ? 'full' : ''}`} />
            </div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Family</div>
            <div className="progress-line">
              <div className={`progress-line-fill ${step >= 3 ? 'full' : ''}`} />
            </div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Member</div>
          </div>
        )}

        {error && <div className="setup-error-badge">{error}</div>}

        {/* Step Views */}
        {step === 1 && (
          <SetupVibeStep
            selectedTheme={selectedTheme}
            onSelectTheme={handleSelectTheme}
            onNext={handleStep1Next}
            onOpenJoinModal={() => setIsJoinModalOpen(true)}
          />
        )}

        {step === 2 && (
          <SetupGuildStep
            themePack={currentThemePack}
            guildName={guildName}
            setGuildName={setGuildName}
            parentPin={parentPin}
            setParentPin={setParentPin}
            parentPinConfirm={parentPinConfirm}
            setParentPinConfirm={setParentPinConfirm}
            onBack={() => setStep(1)}
            onNext={handleStep2Next}
          />
        )}

        {step === 3 && (
          <SetupHeroStep
            themePack={currentThemePack}
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
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
          />
        )}

        {step === 4 && createdData && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '20px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} />
              <span>Zero-Account Privacy Activated</span>
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Your Family Recovery Kit
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.25rem auto', lineHeight: 1.4 }}>
              ChoreQuest stores <strong>no personal info or passwords</strong>. Save this 12-word recovery phrase or Master QR to restore your family on any device!
            </p>

            {/* 12 Words */}
            <div className="recovery-words-grid" style={{ marginBottom: '1rem' }}>
              {recoveryWords.map((word, i) => (
                <div key={i} className="recovery-word-chip">
                  <span className="word-index">{i + 1}</span>
                  <span className="word-text">{word}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopyPhrase}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                {copiedPhrase ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                <span>{copiedPhrase ? 'Copied!' : 'Copy 12 Words'}</span>
              </button>
            </div>

            {/* Master QR */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem' }}>
              <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                <canvas ref={canvasRef} />
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Master Recovery QR Code
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinishSetup}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              <span>Enter ChoreQuest</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        <JoinFamilyModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      </div>
    </div>
  );
}


