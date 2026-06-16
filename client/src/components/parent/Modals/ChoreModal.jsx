import React, { useState, useEffect } from 'react';
import { Sword } from 'lucide-react';

export default function ChoreModal({
  isOpen,
  onClose,
  chore,
  kids,
  onSubmit
}) {
  const [form, setForm] = useState({
    id: null,
    title: '',
    description: '',
    points: 10,
    schedule_type: 'daily',
    schedule_days: '',
    assigned_to: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (chore) {
        setForm({
          id: chore.id || null,
          title: chore.title || '',
          description: chore.description || '',
          points: chore.points !== undefined ? chore.points : 10,
          schedule_type: chore.schedule_type || 'daily',
          schedule_days: chore.schedule_days || '',
          assigned_to: chore.assigned_to !== undefined && chore.assigned_to !== null ? chore.assigned_to : ''
        });
      } else {
        setForm({
          id: null,
          title: '',
          description: '',
          points: 10,
          schedule_type: 'daily',
          schedule_days: '',
          assigned_to: ''
        });
      }
    }
  }, [isOpen, chore]);

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
            <Sword size={20} /> {form.id ? 'Edit Quest Details' : 'Forge New Quest'}
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
            <span className="input-label">Quest Title (Chore Name)</span>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g., Vacuum the living room"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <span className="input-label">Description (Instructions)</span>
            <textarea
              className="glass-textarea"
              rows={3}
              placeholder="Provide clear steps for full coins..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <span className="input-label">Gold Value</span>
              <input
                type="number"
                className="glass-input"
                min={0}
                max={1000}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                required
              />
            </div>

            <div className="input-group" style={{ flex: 1 }}>
              <span className="input-label">Assignee Hero</span>
              <select
                className="glass-select"
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              >
                <option value="">🌎 Everyone (Public Quest)</option>
                {kids.map((kid) => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <span className="input-label">Schedule Cycle</span>
            <select
              className="glass-select"
              value={form.schedule_type}
              onChange={(e) => setForm({ ...form, schedule_type: e.target.value })}
            >
              <option value="daily">📅 Daily (Repeats Every Day)</option>
              <option value="weekly">📆 Weekly (Checkoff Once a Week)</option>
              <option value="alternate">🔄 Alternate Days (Every Other Day)</option>
              <option value="custom">🛠️ Custom Days (Mon/Wed/Fri, etc.)</option>
            </select>
          </div>

          {form.schedule_type === 'custom' && (
            <div className="input-group">
              <span className="input-label">
                Active Weekdays (Comma-Separated Indices: 0-Sun to 6-Sat)
              </span>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. 1,3,5 for Mon/Wed/Fri"
                value={form.schedule_days}
                onChange={(e) => setForm({ ...form, schedule_days: e.target.value })}
              />
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
              Save Quest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
