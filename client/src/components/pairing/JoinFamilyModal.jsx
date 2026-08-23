import React, { useState, useEffect, useRef } from 'react';
import { QrCode, KeyRound, Camera, ArrowRight, ShieldAlert, Sparkles, X, Check, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function JoinFamilyModal({ isOpen, onClose, onJoinSuccess }) {
  const [tab, setTab] = useState('code'); // 'code', 'camera', 'recover'
  const [pairingCode, setPairingCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerStarted, setScannerStarted] = useState(false);

  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setError('');
      setPairingCode('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (tab === 'camera' && isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [tab, isOpen]);

  const startScanner = async () => {
    setError('');
    setScannerStarted(false);
    try {
      if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5Qrcode('qr-reader-region');
      }

      await scannerInstanceRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Successfully decoded
          stopScanner();
          handleScannedData(decodedText);
        },
        (errorMessage) => {
          // scanning frame errors are expected and ignored
        }
      );
      setScannerStarted(true);
    } catch (err) {
      console.warn('Camera scan failed to start:', err);
      setError('Camera access denied or unavailable. You can enter the 6-character code manually!');
      setScannerStarted(false);
    }
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          scannerInstanceRef.current.stop().then(() => {
            scannerInstanceRef.current.clear();
          }).catch(() => {});
        }
      } catch (e) {}
    }
    setScannerStarted(false);
  };

  const handleScannedData = async (raw) => {
    setLoading(true);
    setError('');
    try {
      let payload = raw;
      let codeToUse = raw;

      try {
        const parsed = JSON.parse(raw);
        if (parsed.type === 'recovery') {
          // It's a recovery QR code
          setRecoveryPhrase(parsed.key || '');
          setTab('recover');
          setLoading(false);
          return;
        }
        if (parsed.code) {
          codeToUse = parsed.code;
        }
      } catch (e) {
        // Raw string
      }

      await executeJoin(codeToUse);
    } catch (err) {
      setError(err.message || 'Failed to join family via QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!pairingCode.trim()) {
      setError('Please enter a 6-character pairing code.');
      return;
    }
    await executeJoin(pairingCode.trim());
  };

  const executeJoin = async (code) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/household/pair/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          device_name: deviceName.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join family.');
      }

      localStorage.setItem('cq_household_id', data.householdId);
      localStorage.setItem('cq_device_token', data.deviceToken);
      localStorage.setItem('cq_role', data.role);
      localStorage.setItem('cq_guild_name', data.guildName || 'ChoreQuest');

      onJoinSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!recoveryPhrase.trim()) {
      setError('Please enter your 12-word recovery phrase.');
      return;
    }
    if (!parentPin.trim()) {
      setError('Please enter your 4-digit Parent PIN.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/household/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recovery_key: recoveryPhrase.trim(),
          parent_pin: parentPin.trim(),
          device_name: deviceName.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Recovery failed.');
      }

      localStorage.setItem('cq_household_id', data.householdId);
      localStorage.setItem('cq_device_token', data.deviceToken);
      localStorage.setItem('cq_role', 'parent');
      localStorage.setItem('cq_guild_name', data.guildName || 'ChoreQuest');

      onJoinSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card pairing-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="icon-badge theme-parent">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Join Your Family Guild</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Zero passwords or accounts needed!
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${tab === 'code' ? 'active' : ''}`}
            onClick={() => setTab('code')}
          >
            <KeyRound size={16} />
            6-Digit Code
          </button>
          <button
            className={`tab-btn ${tab === 'camera' ? 'active' : ''}`}
            onClick={() => setTab('camera')}
          >
            <Camera size={16} />
            Scan QR
          </button>
          <button
            className={`tab-btn ${tab === 'recover' ? 'active' : ''}`}
            onClick={() => setTab('recover')}
          >
            <ShieldAlert size={16} />
            Recovery Phrase
          </button>
        </div>

        {error && <div className="setup-error-badge" style={{ margin: '1rem 0' }}>{error}</div>}

        {/* Option 1: 6-Character Code */}
        {tab === 'code' && (
          <form onSubmit={handleCodeSubmit} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Family Join Code</label>
              <input
                type="text"
                placeholder="e.g. CQ-9F4A"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                style={{
                  fontSize: '1.75rem',
                  letterSpacing: '3px',
                  textAlign: 'center',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
                maxLength={10}
                autoFocus
              />
              <span className="field-hint">
                Check the Parent Command Center on the main device for this code.
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Device Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Sam's iPad, Kitchen Tablet"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
              disabled={loading || !pairingCode.trim()}
            >
              {loading ? <RefreshCw className="spin-icon" size={18} /> : <ArrowRight size={18} />}
              <span>Link This Device</span>
            </button>
          </form>
        )}

        {/* Option 2: QR Scanner */}
        {tab === 'camera' && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Hold your camera up to the "Join Family" QR code on the parent device.
            </p>

            <div
              id="qr-reader-region"
              style={{
                width: '100%',
                maxWidth: '320px',
                margin: '0 auto',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
                minHeight: '260px'
              }}
            />

            <div className="form-group" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
              <label>Device Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Living Room Kiosk"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Option 3: Disaster Recovery */}
        {tab === 'recover' && (
          <form onSubmit={handleRecoverySubmit} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>12-Word Recovery Phrase</label>
              <textarea
                rows={3}
                placeholder="e.g. falcon ember crystal galaxy shield orbit river timber shadow planet rocket puzzle"
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                style={{ fontSize: '0.95rem', resize: 'none' }}
                autoFocus
              />
              <span className="field-hint">
                Enter the emergency recovery phrase from your original Parent Setup.
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Master Parent PIN (4 Digits)</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={parentPin}
                onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))}
                style={{ letterSpacing: '4px', fontSize: '1.25rem', textAlign: 'center' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
              disabled={loading || !recoveryPhrase.trim() || parentPin.length !== 4}
            >
              {loading ? <RefreshCw className="spin-icon" size={18} /> : <Check size={18} />}
              <span>Restore Full Family Access</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
