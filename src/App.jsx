import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Coins, Package, ChevronDown, User, Settings, LogOut, X } from 'lucide-react';
import PackOpener from './components/PackOpener';
import Inventory from './components/Inventory';
import './App.css';

function App() {
  const [userCredit, setUserCredit] = useState(5.0);
  const [appState, setAppState] = useState('store'); // 'store' | 'opening' | 'inventory'
  const [openedCards, setOpenedCards] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [creditAlert, setCreditAlert] = useState(false);
  
  const userProfile = {
    name: "Planeswalker",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jace"
  };

  const handlePackOpened = (cards) => {
    setOpenedCards(cards);
    setAppState('inventory');
  };

  const handleAddCredit = (amount) => {
    setUserCredit(prev => prev + amount);
  };

  const handleBuyPack = () => {
    const packPrice = 3.99;
    if (userCredit >= packPrice) {
      setUserCredit(prev => prev - packPrice);
      setAppState('opening');
    } else {
      setCreditAlert(true);
    }
  };

  return (
    <div className="app-container">
      <header className="glass">
        <div className="logo">
          <span className="logo-icon">🎴</span>
          <h1>Mythic Boosters</h1>
        </div>
        <div className="user-stats">
          <div className="stat">
            <Coins size={20} className="text-gold" />
            <span>${userCredit.toFixed(2)}</span>
          </div>

          <div className="profile-menu-container">
            <div className="profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <img src={userProfile.avatar} alt="Profile" className="profile-avatar" />
              <ChevronDown size={16} className={`chevron-icon ${isProfileOpen ? 'open' : ''}`} />
            </div>
            
            {isProfileOpen && (
              <div className="profile-dropdown glass">
                <div className="dropdown-header">
                  <strong>{userProfile.name}</strong>
                  <span className="dropdown-email">user@magicthegathering.com</span>
                </div>
                <hr className="dropdown-divider" />
                <ul className="dropdown-list">
                  <li><User size={16} /> My Account</li>
                  <li><Settings size={16} /> Settings</li>
                  <li className="logout-item"><LogOut size={16} /> Logout</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {appState === 'store' && (
          <div className="store-view">
            <h2>Digital Boosters</h2>
            <p className="subtitle">Open a pack and instantly redeem or exchange for store credit.</p>
            
            <div className="product-card glass">
              <div className="product-image">
                <Package size={80} className="text-blue" />
              </div>
              <div className="product-info">
                <h3>Bloomburrow Digital Booster</h3>
                <p>16 Cards: 10 Commons, 4 Uncommons, 1 Rare/Mythic, 1 Token</p>
                <div className="price-tag">$3.99</div>
                <button 
                  className="buy-button"
                  onClick={handleBuyPack}
                >
                  Buy & Open Now
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === 'opening' && (
          <PackOpener onComplete={handlePackOpened} />
        )}

        {appState === 'inventory' && (
          <Inventory 
            cards={openedCards} 
            onGoBack={() => setAppState('store')}
            onAddCredit={handleAddCredit}
          />
        )}
      </main>

      {creditAlert && createPortal(
        <div className="tutorial-overlay" onClick={() => setCreditAlert(false)}>
          <div className="tutorial-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setCreditAlert(false)} aria-label="Cerrar">
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>⚠️ Saldo Insuficiente</h2>
            <p style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: 'var(--text-muted)' }}>
              No cuentas con los créditos suficientes para adquirir este sobre ($3.99). Vende algunas de las cartas de tu colección para obtener crédito.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button 
                className="buy-button" 
                style={{ width: 'auto', padding: '0.75rem 2rem' }}
                onClick={() => setCreditAlert(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default App;
