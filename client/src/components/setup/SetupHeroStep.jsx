import React from 'react';

export default function SetupHeroStep({
  kidName,
  setKidName,
  kidPin,
  setKidPin,
  kidTheme,
  setKidTheme,
  kidAvatar,
  setKidAvatar,
  avatars,
  themes,
  loading,
  onBack,
  onSubmit
}) {
  return (
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
        <button className="btn-setup-back" type="button" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-setup-submit"
          type="button"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? 'Initializing Guild...' : 'Complete Onboarding! 🚀'}
        </button>
      </div>
    </div>
  );
}
