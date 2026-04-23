import { useState, useRef, useEffect, useCallback } from 'react';
import { Coins, Package, ChevronDown, User, Settings, LogOut, X } from 'lucide-react';
import PackOpener from './components/PackOpener';
import Inventory from './components/Inventory';
import './App.css';

const PACK_PRICE = 3.99;
const SESSION_VERSION = '1';

const USER_PROFILE = {
  name: 'Planeswalker',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jace',
};

function App() {
  const [userCredit, setUserCredit] = useState(() => {
    try {
      if (sessionStorage.getItem('mtg_version') !== SESSION_VERSION) {
        sessionStorage.clear();
        sessionStorage.setItem('mtg_version', SESSION_VERSION);
        return 5.0;
      }
      const saved = sessionStorage.getItem('mtg_credit');
      return saved !== null ? parseFloat(saved) : 5.0;
    } catch (e) {
      console.warn("No se pudo acceder a sessionStorage", e);
      return 5.0;
    }
  });

  const [appState, setAppState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('mtg_appState');
      return saved === 'inventory' ? 'inventory' : 'store';
    } catch {
      return 'store';
    }
  });

  const [openedCards, setOpenedCards] = useState(() => {
    try {
      if (sessionStorage.getItem('mtg_appState') === 'inventory') {
        try {
          const saved = sessionStorage.getItem('mtg_cards');
          const parsed = saved ? JSON.parse(saved) : [];
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
    } catch {
      return [];
    }
    return [];
  });

  const [isProfileOpen, setIsProfileOpen]           = useState(false);
  const [creditAlert, setCreditAlert]               = useState(false);
  const [purchaseConfirmAlert, setPurchaseConfirmAlert] = useState(false);
  const [avatarError, setAvatarError]               = useState(false);

  const profileRef = useRef(null);

  useEffect(() => { 
    try { sessionStorage.setItem('mtg_appState', appState); } catch(e) {} 
  }, [appState]);
  useEffect(() => { 
    try { sessionStorage.setItem('mtg_credit', userCredit.toString()); } catch(e) {} 
  }, [userCredit]);

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

  const handlePackOpened = useCallback((cards) => {
    setOpenedCards(cards);
    setAppState('inventory');
  }, []);

  const handleAddCredit = useCallback((amount) => {
    setUserCredit(prev => prev + amount);
  }, []);

  const handleGoBackToStore = useCallback(() => {
    try {
      sessionStorage.removeItem('mtg_cards');
    } catch (e) {
      console.warn(e);
    }
    setAppState('store');
  }, []);

  const handleBuyPackClick = useCallback(() => {
    if (userCredit >= PACK_PRICE) {
      setPurchaseConfirmAlert(true);
    } else {
      setCreditAlert(true);
    }
  }, [userCredit]);

  const confirmPurchase = useCallback(() => {
    setPurchaseConfirmAlert(false);
    setUserCredit(prev => prev - PACK_PRICE);
    setAppState('opening');
  }, []);

  return (
    <div className="app-container">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Saldo disponible: ${userCredit.toFixed(2)}
      </span>

      <header className="glass">
        <div className="logo">
          <span className="logo-icon">🎴</span>
          <h1>Mythic Boosters</h1>
        </div>
        <div className="user-stats">
          <div className="stat">
            <Coins size={20} className="text-gold" />
            <span aria-hidden="true">${userCredit.toFixed(2)}</span>
          </div>

          <div className="profile-menu-container" ref={profileRef}>
            <button
              className="profile-trigger"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Menú de perfil"
              aria-expanded={isProfileOpen}
              type="button"
            >
              {avatarError ? (
                <div className="profile-avatar profile-avatar-fallback">
                  <User size={20} />
                </div>
              ) : (
                <img
                  src={USER_PROFILE.avatar}
                  alt="Avatar de perfil"
                  className="profile-avatar"
                  onError={() => setAvatarError(true)}
                />
              )}
              <ChevronDown size={16} className={`chevron-icon ${isProfileOpen ? 'open' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown glass">
                <div className="dropdown-header">
                  <strong>{USER_PROFILE.name}</strong>
                  <span className="dropdown-email">usuario@magicthegathering.com</span>
                </div>
                <hr className="dropdown-divider" />
                <ul className="dropdown-list">
                  <li><button type="button" className="dropdown-item"><User size={16} /> Mi Cuenta</button></li>
                  <li><button type="button" className="dropdown-item"><Settings size={16} /> Configuración</button></li>
                  <li><button type="button" className="dropdown-item logout-item"><LogOut size={16} /> Cerrar Sesión</button></li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {appState === 'store' && (
          <div className="store-view">
            <h2>Sobres Digitales</h2>
            <p className="subtitle">Abre sobres digitales de Magic: The Gathering, canjea tus cartas físicas para su envio o véndelas por saldo al instante.</p>

            <div className="product-card glass">
              <div className="product-info-top">
                <h3 className="product-title">Sobre Digital de Bloomburrow</h3>
                <div className="price-tag">${PACK_PRICE.toFixed(2)}</div>
                <p className="product-desc">
                  16 Cartas: 10 Comunes, 4 Infrecuentes, 1 Rara/Mítica, 1 Token
                </p>
              </div>

              <div className="product-image">
                <Package size={80} className="text-blue" />
              </div>

              <div className="product-actions">
                <button className="buy-button" onClick={handleBuyPackClick}>
                  Comprar y Abrir Ahora
                </button>
              </div>
            </div>
          </div>
        )}

        {appState === 'opening' && (
          <PackOpener onComplete={handlePackOpened} onBack={handleGoBackToStore} />
        )}

        {appState === 'inventory' && (
          <Inventory
            cards={openedCards}
            onGoBack={handleGoBackToStore}
            onAddCredit={handleAddCredit}
          />
        )}
      </main>

      {creditAlert && (
        <div className="app-modal-overlay" onClick={() => setCreditAlert(false)}>
          <div className="app-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="app-modal-close" onClick={() => setCreditAlert(false)} aria-label="Cerrar">
              <X size={24} />
            </button>
            <h2 className="app-modal-title">⚠️ Saldo Insuficiente</h2>
            <p className="app-modal-body">
              No cuentas con saldo suficiente para adquirir este sobre (${PACK_PRICE.toFixed(2)}). Agrega saldo a tu cuenta.
            </p>
            <div className="app-modal-actions">
              <button className="buy-button app-modal-btn" onClick={() => setCreditAlert(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {purchaseConfirmAlert && (
        <div className="app-modal-overlay" onClick={() => setPurchaseConfirmAlert(false)}>
          <div className="app-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="app-modal-close" onClick={() => setPurchaseConfirmAlert(false)} aria-label="Cerrar">
              <X size={24} />
            </button>
            <h2 className="app-modal-title">🛒 Confirmar Compra</h2>
            <p className="app-modal-body">
              ¿Estás seguro de que deseas gastar ${PACK_PRICE.toFixed(2)} de tu saldo para abrir este Sobre Digital de Bloomburrow?
            </p>
            <div className="app-modal-actions">
              <button className="app-modal-cancel-btn" onClick={() => setPurchaseConfirmAlert(false)}>
                Cancelar
              </button>
              <button className="buy-button app-modal-btn" onClick={confirmPurchase}>
                Comprar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
