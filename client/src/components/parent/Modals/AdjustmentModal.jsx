import React, { useState, useEffect } from 'react';

export default function AdjustmentModal({
  isOpen,
  onClose,
  kid,
  onSubmit
}) {
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAmount(0);
    }
  }, [isOpen]);

  if (!isOpen || !kid) return null;

  const handleSubmitSubmit = (e) => {
    e.preventDefault();
    onSubmit(Number(amount));
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content theme-parent">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.4rem' }}>Adjust Gold Balance: {kid.name}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form
          onSubmit={handleSubmitSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            You can manually add or deduct gold coins for this hero's balance. Use positive
            numbers to reward, negative numbers to penalize.
          </p>

          <div className="input-group">
            <span className="input-label">Adjustment Amount</span>
            <input
              type="number"
              className="glass-input"
              placeholder="e.g., 50 or -50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

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
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
