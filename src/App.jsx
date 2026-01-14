import { useState, useEffect } from 'react'
import { HomeView } from './views/HomeView'
import { DuelView } from './views/DuelView'
import { Tournament3View } from './views/Tournament3View'
import { Tournament4View } from './views/Tournament4View'
import { StatsView } from './views/StatsView'
import { NeonBall } from './components/NeonBall'
import { useAudio } from './hooks/useAudio'

import { CloudService } from './services/CloudService'
import { auth } from './config/firebase'
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

function App() {
  const [currentView, setCurrentView] = useState('HOME');
  const { toggleBgMusic, volume, setVolume, playClick } = useAudio();
  const [isMuted, setIsMuted] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // Auth State
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // If true, "Edit Mode" is active

  useEffect(() => {
    // 1. Start Cloud Sync (Listen to DB)
    CloudService.syncFromCloud((type) => {
      console.log(`Cloud update received: ${type}`);
      // Force update or just let Views re-render naturally? 
      // Views using standard StorageService getters will see new data on next render.
      // To force render, we can just update a dummy state or "lastUpdated".
    });

    // 2. Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(!!u); // Simple logic: any logged user is Admin for now
    });

    return () => unsubscribe();
  }, []);

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(0.5);
      setIsMuted(false);
      toggleBgMusic(true);
    } else {
      setVolume(0);
      setIsMuted(true);
      toggleBgMusic(false);
    }
    playClick();
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert("Error al iniciar sesión: " + e.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const renderView = () => {
    const commonProps = {
      onNavigate: setCurrentView,
      onBack: () => {
        setShowUI(true);
        setCurrentView('HOME');
      },
      onToggleUI: setShowUI,
      isAdmin, // Pass Admin State
      user,    // Pass User Object
      handleGoogleLogin, // Pass Google Login
      handleLogout // Pass Logout
    };

    switch (currentView) {
      case 'HOME':
        return <HomeView {...commonProps} />;
      case 'DUEL':
        return <DuelView {...commonProps} />;
      case 'TORNEO3':
        return <Tournament3View {...commonProps} />;
      case 'TORNEO4':
        return <Tournament4View {...commonProps} />;
      case 'STATS':
        return <StatsView {...commonProps} />;
      default:
        return <HomeView {...commonProps} />;
    }
  }

  return (
    <div className="phone-frame animate-scale-in">
      <div className="phone-content">
        <div className="phone-pattern"></div>
        {/* Helper Login Button (Hidden for now, maybe toggleable) */}
        {showUI && (
          <header className="app-header">
            {/* User Profile */}
            <div className="header-profile">
              <div className="avatar-frame">
                <img src="/icon.png" alt="Avatar" className="avatar-img" />
              </div>
              <div className="user-info">
                <div className="user-name-row">
                  <img src="https://flagcdn.com/ar.svg" alt="Flag" className="user-flag" />
                  <span className="user-name">Broccoli</span>
                </div>
                <div className="user-stats-row">
                  <div className="level-badge">68</div>
                  <div className="xp-bar">
                    <div className="xp-fill"></div>
                  </div>
                  <span className="xp-text">4071/6400XP</span>
                </div>
              </div>
            </div>

            {/* Currency / Settings */}
            <div className="header-actions">
              <div className="currency-display">
                <span className="currency-icon">T</span>
                <span className="currency-amount">133 417 872</span>
                <div className="currency-add">+</div>
              </div>
              <button onClick={handleMuteToggle} className="icon-btn">
                {isMuted ? '🔇' : '⚙️'}
              </button>
            </div>
          </header>
        )}

        {/* MAIN AREA */}
        <main className="app-main">
          {renderView()}
        </main>

        {/* BOTTOM NAVIGATION */}
        {showUI && (
          <nav className="app-nav">
            <button
              onClick={() => setCurrentView('HOME')}
              className={`nav-item ${currentView === 'HOME' ? 'active' : ''}`}>
              <div className="nav-icon">🏠</div>
            </button>

            <div className="nav-divider"></div>

            <button
              onClick={() => setCurrentView('DUEL')}
              className={`nav-item ${currentView === 'DUEL' ? 'active' : ''}`}>
              <div className="nav-icon">🎯</div>
            </button>

            <div className="nav-divider"></div>

            <button
              onClick={() => setCurrentView('TORNEO3')}
              className={`nav-item ${currentView === 'TORNEO3' ? 'active' : ''}`}>
              <div className="nav-icon">🛡️</div>
            </button>

            <div className="nav-divider"></div>

            <button
              onClick={() => setCurrentView('TORNEO4')}
              className={`nav-item ${currentView === 'TORNEO4' ? 'active' : ''}`}>
              <div className="nav-icon">👥</div>
            </button>

            <div className="nav-divider"></div>

            <button
              onClick={() => setCurrentView('STATS')}
              className={`nav-item ${currentView === 'STATS' ? 'active' : ''}`}>
              <div className="nav-icon">📊</div>
            </button>

            <div className="nav-spacer"></div>

            <button className="store-button">
              <span className="store-text">TIENDA</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}

export default App
