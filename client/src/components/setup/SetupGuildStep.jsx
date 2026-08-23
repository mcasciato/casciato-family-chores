import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function SetupGuildStep({
  themePack,
  guildName,
  setGuildName,
  parentPin,
  setParentPin,
  parentPinConfirm,
  setParentPinConfirm,
  onBack,
  onNext
}) {
  return (
    <div className="setup-form-step">
      <h2>{themePack?.icon || '🏡'} Name Your {themePack?.householdLabel || 'Family Group'}</h2>
      <p className="description">
        Set your family name and a secure 4-digit Parent PIN to manage settings and approve tasks.
      </p>

      <div className="input-group">
        <label>{themePack?.householdLabel || 'Family'} Name</label>
        <input
          type="text"
          placeholder={themePack?.householdPlaceholder || 'e.g., Casciato Family'}
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

      <div className="setup-buttons-row">
        <button className="btn-setup-back" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn-setup-submit" type="button" onClick={onNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span>Next: Add {themePack?.memberLabel || 'Member'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

