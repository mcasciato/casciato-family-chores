import React, { useState, useEffect } from 'react';
import ProfileSelect from './pages/ProfileSelect.jsx';
import KidDashboard from './pages/KidDashboard.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import { ShieldCheck, Award } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('profile_select'); // 'profile_select', 'kid_dashboard', 'parent_dashboard'
  const [kids, setKids] = useState([]);
  const [currentKid, setCurrentKid] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch kids list on initial mount
  useEffect(() => {
    fetchKids();
  }, []);

  const fetchKids = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kids');
      const data = await res.json();
      setKids(data);
    } catch (err) {
      console.error('Error fetching kids profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const [parentToken, setParentToken] = useState(null);

  const handleSelectKid = (kid) => {
    setCurrentKid(kid);
    setView('kid_dashboard');
  };

  const handleSelectParent = (token) => {
    setParentToken(token);
    setCurrentKid(null);
    setView('parent_dashboard');
  };

  const handleBackToProfiles = () => {
    setParentToken(null);
    setCurrentKid(null);
    setView('profile_select');
    fetchKids(); // Refresh points/data when returning
  };

  const handleUpdateKidPoints = (newPoints) => {
    if (currentKid) {
      setCurrentKid({ ...currentKid, points: newPoints });
    }
    // Update inside kids array too
    setKids(prevKids =>
      prevKids.map(k => (k.id === currentKid?.id ? { ...k, points: newPoints } : k))
    );
  };

  const handleAddKid = async (kidData) => {
    try {
      const res = await fetch('/api/kids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kidData)
      });
      if (res.ok) {
        await fetchKids(); // Reload kids list
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add hero.');
        return false;
      }
    } catch (err) {
      console.error('Error adding kid profile:', err);
      return false;
    }
  };

  return (
    <div className="app-container">
      {/* Global Header */}
      <header className="app-header">
        <div className="brand" onClick={handleBackToProfiles} style={{ cursor: 'pointer' }}>
          <span className="logo-icon">👑</span>
          <h1>ChoreQuest</h1>
        </div>

        <div className="header-actions">
          {view === 'kid_dashboard' && currentKid && (
            <div className={`user-badge theme-${currentKid.color_theme}`} onClick={handleBackToProfiles}>
              <span className="user-avatar">{currentKid.avatar}</span>
              <span className="user-name">{currentKid.name}</span>
            </div>
          )}

          {view === 'parent_dashboard' && (
            <div className="user-badge theme-parent" onClick={handleBackToProfiles}>
              <ShieldCheck size={16} style={{ color: 'var(--theme-parent)' }} />
              <span className="user-name">Parents</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Core View Engine */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {loading && view === 'profile_select' ? (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--theme-violet)',
              borderRadius: '50%',
              animation: 'scaleIn 1s infinite linear',
              margin: '0 auto 1.5rem auto'
            }} />
            <p style={{ color: 'var(--text-muted)' }}>Opening the gates of ChoreQuest...</p>
          </div>
        ) : (
          <>
            {view === 'profile_select' && (
              <ProfileSelect
                kids={kids}
                onSelectKid={handleSelectKid}
                onSelectParent={handleSelectParent}
                onAddKid={handleAddKid}
              />
            )}

            {view === 'kid_dashboard' && currentKid && (
              <KidDashboard
                kid={currentKid}
                onBackToProfiles={handleBackToProfiles}
                onUpdateKidPoints={handleUpdateKidPoints}
              />
            )}

            {view === 'parent_dashboard' && (
              <ParentDashboard
                kids={kids}
                parentToken={parentToken}
                onBackToProfiles={handleBackToProfiles}
                onReloadKids={fetchKids}
              />
            )}
          </>
        )}
      </main>

      {/* Subtle Footer */}
      <footer style={{
        marginTop: '4rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        ChoreQuest — Gamified Family Chore System. Perfect for hosting on a local Raspberry Pi.
      </footer>
    </div>
  );
}
