import React from 'react';

export default function SetupHeroStep({
  themePack,
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
      <h2>{themePack?.icon || '🌟'} Add Your First {themePack?.memberLabel || 'Member'}</h2>
      <p className="description">
        Create a profile for your first child. They will log in using their own 4-digit PIN to
        check off daily tasks and earn {themePack?.currencyName || 'points'}!
      </p>

      <div className="input-group">
        <label>{themePack?.memberLabel || 'Member'}'s Name</label>
        <input
          type="text"
          placeholder="e.g., Mac"
          value={kidName}
          onChange={(e) => setKidName(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>{themePack?.memberLabel || 'Member'} PIN (4 digits)</label>
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
        <label>Choose Color Accent</label>
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
          {loading ? 'Creating Household...' : `Complete Setup! ${themePack?.icon || '🚀'}`}
        </button>
      </div>
    </div>
  );
}

