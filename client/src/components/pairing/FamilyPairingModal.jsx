import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Smartphone, Tablet, RefreshCw, X, Copy, Check, Trash2, Shield, User, Clock, KeyRound, ShieldAlert } from 'lucide-react';
import QRCode from 'qrcode';
import RecoveryKitModal from './RecoveryKitModal';

export default function FamilyPairingModal({ isOpen, onClose, householdId, guildName, parentToken }) {
  const [activeTab, setActiveTab] = useState('pair'); // 'pair', 'devices'
  const [role, setRole] = useState('kid'); // 'kid' or 'parent'
  const [pairingData, setPairingData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      generatePairingCode(role);
      fetchDevices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      generatePairingCode(role);
    }
  }, [role]);

  // Countdown timer for pairing code
  useEffect(() => {
    if (!pairingData?.expiresAt) return;
    const interval = setInterval(() => {
      const expiresEpoch = typeof pairingData.expiresAt === 'number'
        ? pairingData.expiresAt
        : new Date(pairingData.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresEpoch - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pairingData]);

  // Render QR Code onto canvas
  useEffect(() => {
    if (pairingData && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        pairingData.qrPayload || pairingData.code,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [pairingData]);

  const generatePairingCode = async (selectedRole) => {
    setLoadingCode(true);
    setCopiedCode(false);
    try {
      const res = await fetch('/api/household/pair/create-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-token': parentToken,
          'x-household-id': householdId || ''
        },
        body: JSON.stringify({ role: selectedRole })
      });
      if (res.ok) {
        const data = await res.json();
        setPairingData(data);
      }
    } catch (err) {
      console.error('Error creating pairing code:', err);
    } finally {
      setLoadingCode(false);
    }
  };

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const res = await fetch('/api/household/devices', {
        headers: {
          'x-parent-token': parentToken,
          'x-household-id': householdId || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.error('Error fetching linked devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleRevokeDevice = async (token) => {
    if (!window.confirm('Are you sure you want to unlink this device? It will lose access immediately.')) {
      return;
    }
    try {
      const res = await fetch(`/api/household/devices/${token}`, {
        method: 'DELETE',
        headers: {
          'x-parent-token': parentToken,
          'x-household-id': householdId || ''
        }
      });
      if (res.ok) {
        setDevices((prev) => prev.filter((d) => d.token !== token));
      }
    } catch (err) {
      console.error('Error revoking device:', err);
    }
  };

  const handleCopyCode = () => {
    if (pairingData?.code) {
      navigator.clipboard.writeText(pairingData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card family-pairing-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="icon-badge theme-parent">
                <QrCode size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Link Family Devices</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Pair tablets &amp; phones without creating logins
                </p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="modal-tabs" style={{ marginBottom: '1.25rem' }}>
            <button
              className={`tab-btn ${activeTab === 'pair' ? 'active' : ''}`}
              onClick={() => setActiveTab('pair')}
            >
              <QrCode size={16} />
              Pair Device
            </button>
            <button
              className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('devices');
                fetchDevices();
              }}
            >
              <Smartphone size={16} />
              Linked Devices ({devices.length})
            </button>
          </div>

          {activeTab === 'pair' && (
            <div>
              {/* Role Toggle */}
              <div className="role-selector-pills" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  className={`btn ${role === 'kid' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '0.6rem 0.5rem', fontSize: '0.9rem' }}
                  onClick={() => setRole('kid')}
                >
                  <Tablet size={16} />
                  <span>Link Hero Device</span>
                </button>
                <button
                  type="button"
                  className={`btn ${role === 'parent' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, padding: '0.6rem 0.5rem', fontSize: '0.9rem' }}
                  onClick={() => setRole('parent')}
                >
                  <Shield size={16} />
                  <span>Link Co-Parent</span>
                </button>
              </div>

              {/* QR & Code Card */}
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                {loadingCode ? (
                  <div style={{ padding: '3rem 0', color: 'var(--text-muted)' }}>
                    <RefreshCw className="spin-icon" size={24} style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0 }}>Generating fresh pairing key...</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      On the new device, open ChoreQuest and select <strong>"Join Existing Family"</strong>:
                    </p>

                    {/* QR Code Canvas */}
                    <div style={{ background: '#ffffff', padding: '10px', borderRadius: '12px', display: 'inline-block', marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                      <canvas ref={canvasRef} />
                    </div>

                    {/* 6-Character Code Display */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div className="pairing-code-badge">
                        {pairingData?.code || 'CQ-....'}
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={handleCopyCode}
                        style={{ padding: '0.5rem 0.75rem' }}
                        title="Copy Code"
                      >
                        {copiedCode ? <Check size={18} style={{ color: 'var(--success)' }} /> : <Copy size={18} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Clock size={14} />
                      <span>Code expires in: <strong>{formatTime(timeLeft)}</strong></span>
                      <button
                        type="button"
                        onClick={() => generatePairingCode(role)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '0.5rem' }}
                      >
                        <RefreshCw size={12} /> Refresh
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Recovery Kit Prompt */}
              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={18} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: '0.85rem' }}>Need an emergency backup for phone upgrades?</span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsRecoveryOpen(true)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Family Recovery Kit
                </button>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {loadingDevices ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading linked devices...
                </div>
              ) : devices.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No extra devices linked yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {devices.map((device) => {
                    const isParent = device.role === 'parent';
                    const lastSeen = device.last_seen_at
                      ? new Date(device.last_seen_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Never';

                    return (
                      <div
                        key={device.token}
                        className="glass-card"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.85rem 1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            className={`icon-badge ${isParent ? 'theme-parent' : 'theme-purple'}`}
                            style={{ width: '36px', height: '36px' }}
                          >
                            {isParent ? <Shield size={18} /> : <Tablet size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {device.device_name || (isParent ? 'Parent Device' : 'Kid Tablet')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Role: <span style={{ textTransform: 'capitalize' }}>{device.role}</span> • Last active: {lastSeen}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleRevokeDevice(device.token)}
                          title="Unlink Device"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RecoveryKitModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        householdId={householdId}
        guildName={guildName}
        parentToken={parentToken}
      />
    </>
  );
}
