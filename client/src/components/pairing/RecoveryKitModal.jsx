import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Copy, Check, Printer, X, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';

export default function RecoveryKitModal({ isOpen, onClose, householdId, guildName, parentToken }) {
  const [recoveryData, setRecoveryData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecoveryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, parentToken]);

  const fetchRecoveryData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/household/recovery-kit', {
        headers: {
          'x-parent-token': parentToken,
          'x-household-id': householdId || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRecoveryData(data);
      }
    } catch (err) {
      console.error('Error fetching recovery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recoveryData && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        recoveryData.qrRecoveryPayload || recoveryData.recoveryKey,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('Error generating recovery QR:', error);
        }
      );
    }
  }, [recoveryData]);

  const handleCopyWords = () => {
    if (recoveryData?.recoveryKey) {
      navigator.clipboard.writeText(recoveryData.recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const words = recoveryData?.recoveryKey ? recoveryData.recoveryKey.split(' ') : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card recovery-kit-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="icon-badge theme-parent">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Family Recovery Kit</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {guildName || 'ChoreQuest'} Backup
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="recovery-notice-box">
          <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
            Since ChoreQuest does not store any emails or passwords, this <strong>12-word recovery phrase</strong> and <strong>Master QR</strong> are the only way to recover full access if your phone is lost or replaced.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading recovery kit...
          </div>
        ) : (
          <div className="printable-recovery-content">
            {/* 12 Word Matrix */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  12-Word Recovery Phrase
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCopyWords}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', gap: '0.35rem' }}
                >
                  {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Phrase'}</span>
                </button>
              </div>

              <div className="recovery-words-grid">
                {words.map((word, index) => (
                  <div key={index} className="recovery-word-chip">
                    <span className="word-index">{index + 1}</span>
                    <span className="word-text">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recovery QR Canvas */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Master Recovery QR
              </span>
              <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>
                <canvas ref={canvasRef} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Scan this with "Join Family" &gt; "Scan QR" on any new device to restore.
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handlePrint}
                style={{ flex: 1, padding: '0.75rem' }}
              >
                <Printer size={18} />
                <span>Print / PDF Backup</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ flex: 1, padding: '0.75rem' }}
              >
                <span>Saved &amp; Protected</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
