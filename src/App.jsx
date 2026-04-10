import { useState, useRef, useEffect } from 'react';
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
  const [purchaseConfirmAlert, setPurchaseConfirmAlert] = useState(false);
  
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  
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

  const handleBuyPackClick = () => {
    const packPrice = 3.99;
    if (userCredit >= packPrice) {
      setPurchaseConfirmAlert(true);
    } else {
      setCreditAlert(true);
    }
  };

  const confirmPurchase = () => {
    const packPrice = 3.99;
    setPurchaseConfirmAlert(false);
    setUserCredit(prev => prev - packPrice);
    setAppState('opening');
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

          <div className="profile-menu-container" ref={profileRef}>
            <div className="profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              <img src={userProfile.avatar} alt="Profile" className="profile-avatar" />
              <ChevronDown size={16} className={`chevron-icon ${isProfileOpen ? 'open' : ''}`} />
            </div>
            
            {isProfileOpen && (
              <div className="profile-dropdown glass">
                <div className="dropdown-header">
                  <strong>{userProfile.name}</strong>
                  <span className="dropdown-email">usuario@magicthegathering.com</span>
                </div>
                <hr className="dropdown-divider" />
                <ul className="dropdown-list">
                  <li><User size={16} /> Mi Cuenta</li>
                  <li><Settings size={16} /> Configuración</li>
                  <li className="logout-item"><LogOut size={16} /> Cerrar Sesión</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {appState === 'store' && (
          <div className="store-view">
            <h2>Sobres Digitales</h2>
            <p className="subtitle">Abre un sobre y canjea o intercambia tus cartas por saldo al instante.</p>
            
            <div className="product-card glass">
              <div className="product-info-top" style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Sobre Digital de Bloomburrow</h3>
                <div className="price-tag" style={{ margin: '0.5rem 0' }}>$3.99</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  16 Cartas: 10 Comunes, 4 Infrecuentes, 1 Rara/Mítica, 1 Token
                </p>
              </div>

              <div className="product-image" style={{ marginBottom: '1.5rem' }}>
                <Package size={80} className="text-blue" />
              </div>

              <div className="product-actions">
                <button 
                  className="buy-button"
                  onClick={handleBuyPackClick}
                >
                  Comprar y Abrir Ahora
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

      {purchaseConfirmAlert && createPortal(
        <div className="tutorial-overlay" onClick={() => setPurchaseConfirmAlert(false)}>
          <div className="tutorial-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setPurchaseConfirmAlert(false)} aria-label="Cancelar">
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>🛒 Confirmar Compra</h2>
            <p style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: 'var(--text-muted)' }}>
              ¿Estás seguro de que deseas gastar $3.99 de tu saldo para abrir este Sobre Digital de Bloomburrow?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button 
                className="batch-btn retain-btn" 
                onClick={() => setPurchaseConfirmAlert(false)}
              >
                Cancelar
              </button>
              <button 
                className="batch-btn sell-btn" 
                onClick={confirmPurchase}
              >
                Comprar
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
