import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SetupGuildStep({
  guildName,
  setGuildName,
  parentPin,
  setParentPin,
  parentPinConfirm,
  setParentPinConfirm,
  onNext
}) {
  return (
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

      <button className="btn-setup-next" onClick={onNext}>
        Continue to Hero Setup <Sparkles size={16} />
      </button>
    </div>
  );
}
