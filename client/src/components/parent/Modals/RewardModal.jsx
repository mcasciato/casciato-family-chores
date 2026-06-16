import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';

export default function RewardModal({
  isOpen,
  onClose,
  reward,
  onSubmit
}) {
  const [form, setForm] = useState({
    id: null,
    title: '',
    description: '',
    points_cost: 50
  });

  useEffect(() => {
    if (isOpen) {
      if (reward) {
        setForm({
          id: reward.id || null,
          title: reward.title || '',
          description: reward.description || '',
          points_cost: reward.points_cost !== undefined ? reward.points_cost : 50
        });
      } else {
        setForm({
          id: null,
          title: '',
          description: '',
          points_cost: 50
        });
      }
    }
  }, [isOpen, reward]);

  if (!isOpen) return null;

  const handleSubmitSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content theme-parent">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gift size={20} /> {form.id ? 'Edit Loot Item' : 'Create New Loot Reward'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form
          onSubmit={handleSubmitSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div className="input-group">
            <span className="input-label">Loot Name (Reward Title)</span>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g., Ice Cream Treat"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <span className="input-label">Loot Description</span>
            <textarea
              className="glass-textarea"
              rows={3}
              placeholder="e.g. A family night trip to get double scoops..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="input-group">
            <span className="input-label">Gold Cost (Coins Required)</span>
            <input
              type="number"
              className="glass-input"
              min={1}
              max={5000}
              value={form.points_cost}
              onChange={(e) => setForm({ ...form, points_cost: e.target.value })}
              required
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
              Forge Loot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
