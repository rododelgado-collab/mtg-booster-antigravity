import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CardDisplay from './CardDisplay';
import { ArrowLeft, X, HelpCircle } from 'lucide-react';
import './Inventory.css';

const Inventory = ({ cards: initialCards, onGoBack, onAddCredit }) => {
  const [cards, setCards] = useState(initialCards.map(c => ({...c, isSelected: false, status: null})));
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('hasSeenInventoryTutorial') !== 'true';
  });

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenInventoryTutorial', 'true');
  };

  // Custom Async Dialog State
  const [modalConfig, setModalConfig] = useState(null);
  const [promptValue, setPromptValue] = useState('');

  const showConfirm = (title, message, confirmText = "Aceptar", cancelText = "Cancelar") => {
    return new Promise((resolve) => {
      setModalConfig({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => { setModalConfig(null); resolve(true); },
        onCancel: () => { setModalConfig(null); resolve(false); }
      });
    });
  };

  const showPrompt = (title, message) => {
    return new Promise((resolve) => {
      setPromptValue('');
      setModalConfig({
        type: 'prompt',
        title,
        message,
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        onConfirm: (val) => { setModalConfig(null); resolve(val); },
        onCancel: () => { setModalConfig(null); resolve(null); }
      });
    });
  };

  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      setModalConfig({
        type: 'alert',
        title,
        message,
        confirmText: 'Entendido',
        onConfirm: () => { setModalConfig(null); resolve(); },
        onCancel: () => { setModalConfig(null); resolve(); } // Same action for closing x
      });
    });
  };

  useEffect(() => {
    const allProcessed = cards.length > 0 && cards.every(c => c.status !== null);
    if (allProcessed) {
      const redeemedCount = cards.filter(c => c.status === 'REDEEMED').length;
      const soldCount = cards.filter(c => c.status === 'SOLD').length;

      let finalMessage = "¡Gracias por procesar tu sobre!";
      if (redeemedCount > 0 && soldCount > 0) {
        finalMessage = `Has sumado crédito a tu saldo por tus ventas y las ${redeemedCount} carta(s) física(s) que canjeaste serán preparadas y enviadas a la dirección indicada. ¡Disfruta el botín!`;
      } else if (redeemedCount > 0 && soldCount === 0) {
        finalMessage = `¡Excelente elección para tu colección! Todas las cartas físicas serán empaquetadas y enviadas a la dirección que indicaste a la brevedad.`;
      } else if (soldCount > 0 && redeemedCount === 0) {
        finalMessage = `¡Tremendo negocio! Todas tus cartas del sobre se han vendido y transformado con éxito en crédito instantáneo para tu cuenta.`;
      }

      setTimeout(() => {
        showAlert("¡Sobre Completado!", finalMessage).then(() => {
          onGoBack();
        });
      }, 300);
    }
  }, [cards, onGoBack]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasUnhandled = cards.some(c => !c.status);
      if (hasUnhandled) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cards]);

  const handleGoBack = async () => {
    const unhandledCards = cards.filter(c => !c.status);
    if (unhandledCards.length > 0) {
      await showAlert(
        "Acción Requerida", 
        `Aún tienes ${unhandledCards.length} carta(s) pendientes. Por favor, vende o canjea todas tus cartas antes de abandonar este sobre.`
      );
      return;
    }
    onGoBack();
  };

  // Grouping
  const commons = cards.filter(c => c.rarity === 'common');
  const uncommons = cards.filter(c => c.rarity === 'uncommon');
  const rares = cards.filter(c => c.rarity === 'rare' || c.rarity === 'mythic');
  const tokens = cards.filter(c => c.rarity === 'token' || c.type_line?.includes('Token'));

  const toggleSelect = (id) => {
    setCards(prev => prev.map(c => 
      c.id === id ? { ...c, isSelected: !c.isSelected } : c
    ));
  };

  const simulateStockCheck = async (cardsToRedeem) => {
    let finalRedeemList = [];
    let convertedValue = 0;
    
    for (let c of cardsToRedeem) {
       // Simulate a 15% out of stock probability
       if (Math.random() < 0.15) {
          const convert = await showConfirm(
             "Quiebre de Stock 🚨",
             `¡Oh no! La carta "${c.name}" recién se agotó en nuestras bodegas.\n\n¿Deseas venderla en su lugar y sumar sus $${c.price.toFixed(2)} automáticamente a tu crédito?`,
             "Aceptar Crédito",
             "Conservarla"
          );
          if (convert) {
             setCards(prev => prev.map(card => card.id === c.id ? { ...card, isSelected: false, status: 'SOLD' } : card));
             onAddCredit(c.price);
             convertedValue += c.price;
          } else {
             setCards(prev => prev.map(card => card.id === c.id ? { ...card, isSelected: false } : card));
          }
       } else {
          finalRedeemList.push(c);
       }
    }
    
    if (convertedValue > 0) {
       await showAlert("Saldo Actualizado", `Se transfirieron exitosamente $${convertedValue.toFixed(2)} a tu cuenta por las cartas sin stock.`);
    }
    
    return finalRedeemList;
  };

  const sellSelected = async () => {
    const selectedCards = cards.filter(c => c.isSelected && !c.status);
    if (selectedCards.length === 0) {
      await showAlert("Aviso", "No hay cartas seleccionadas para vender.");
      return;
    }
    
    const totalToSell = selectedCards.reduce((acc, c) => acc + c.price, 0);
    
    const confirmed = await showConfirm(
      "Confirmar Venta",
      `¿Estás seguro de que deseas VENDER las ${selectedCards.length} cartas seleccionadas por un total de $${totalToSell.toFixed(2)} de crédito?`
    );

    if (confirmed) {
      setCards(prev => prev.map(c => {
        if (c.isSelected && !c.status) {
          return { ...c, isSelected: false, status: 'SOLD' };
        }
        return c;
      }));
      onAddCredit(totalToSell);
    }
  };

  const redeemSelected = async () => {
    const selectedCards = cards.filter(c => c.isSelected && !c.status);
    if (selectedCards.length === 0) {
      await showAlert("Aviso", "No hay cartas seleccionadas para canjear.");
      return;
    }

    const wantsToRedeem = await showConfirm(
      "Confirmar Canje",
      `¿Estás seguro de que deseas CANJEAR (Físico) las ${selectedCards.length} cartas seleccionadas?`
    );

    if (wantsToRedeem) {
      const validCardsToRedeem = await simulateStockCheck(selectedCards);
      
      if (validCardsToRedeem.length === 0) return;

      const useDefaultAddress = await showConfirm(
        "Dirección de Envío",
        `¿Deseas enviar las ${validCardsToRedeem.length} cartas en stock a la dirección agregada previamente?`,
        "Usar Predeterminada",
        "Ingresar Nueva"
      );

      if (!useDefaultAddress) {
        const newAddress = await showPrompt("Nueva Dirección", "Por favor, ingresa la nueva dirección de envío:");
        if (!newAddress || newAddress.trim() === '') {
          await showAlert("Operación Cancelada", "Debes especificar una dirección. Se ha cancelado el envío físico.");
          return;
        }
        await showAlert("Éxito", `Las cartas físicas serán enviadas a: ${newAddress}`);
      } else {
        await showAlert("Éxito", "Las cartas físicas serán enviadas a tu dirección predeterminada.");
      }

      setCards(prev => prev.map(c => {
        if (validCardsToRedeem.find(vc => vc.id === c.id)) {
          return { ...c, isSelected: false, status: 'REDEEMED' };
        }
        return c;
      }));
    }
  };

  const sellAll = async () => {
    const availableCards = cards.filter(c => !c.status);
    if (availableCards.length === 0) {
      await showAlert("Aviso", "No hay cartas disponibles para vender.");
      return;
    }
    
    const totalToSell = availableCards.reduce((acc, c) => acc + c.price, 0);
    
    const confirmed = await showConfirm(
      "Vender Todo",
      `¿Estás seguro de que deseas VENDER TODAS las ${availableCards.length} cartas restantes por un total de $${totalToSell.toFixed(2)} de crédito?`
    );

    if (confirmed) {
      setCards(prev => prev.map(c => !c.status ? { ...c, isSelected: false, status: 'SOLD' } : c));
      onAddCredit(totalToSell);
    }
  };

  const redeemAll = async () => {
    const availableCards = cards.filter(c => !c.status);
    if (availableCards.length === 0) {
      await showAlert("Aviso", "No hay cartas disponibles para canjear.");
      return;
    }

    const wantsToRedeem = await showConfirm(
      "Canjear Todo",
      `¿Estás seguro de que deseas CANJEAR (Físico) TODAS las ${availableCards.length} cartas restantes?`
    );

    if (wantsToRedeem) {
      const validCardsToRedeem = await simulateStockCheck(availableCards);
      
      if (validCardsToRedeem.length === 0) return;

      const useDefaultAddress = await showConfirm(
        "Dirección de Envío",
        `¿Deseas enviar las ${validCardsToRedeem.length} cartas en stock a la dirección agregada previamente?`,
        "Usar Predeterminada",
        "Ingresar Nueva"
      );

      if (!useDefaultAddress) {
        const newAddress = await showPrompt("Nueva Dirección", "Por favor, ingresa la nueva dirección de envío:");
        if (!newAddress || newAddress.trim() === '') {
          await showAlert("Operación Cancelada", "Debes especificar una dirección. Se ha cancelado la operación.");
          return;
        }
        await showAlert("Éxito", `Las cartas físicas serán enviadas a: ${newAddress}`);
      } else {
        await showAlert("Éxito", "Las cartas físicas serán enviadas a tu dirección predeterminada.");
      }

      setCards(prev => prev.map(c => {
        if (validCardsToRedeem.find(vc => vc.id === c.id)) {
           return { ...c, isSelected: false, status: 'REDEEMED' };
        }
        return c;
      }));
    }
  };

  const totalPackValue = cards.reduce((acc, card) => acc + card.price, 0);

  return (
    <div className="inventory-view">
      <div className="inventory-header">
        <button className="back-button glass" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          <span>Volver a la Tienda</span>
        </button>

        <div className="pack-summary glass">
          <span className="summary-label">Valor Total del Sobre: </span>
          <span className="summary-value text-gold">${totalPackValue.toFixed(2)}</span>
          <button 
            className="help-button" 
            onClick={() => setShowTutorial(true)}
            title="Ver Guía de Uso"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--accent-blue)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              marginLeft: '0.5rem',
              transition: 'var(--transition)'
            }}
          >
            <HelpCircle size={22} />
          </button>
        </div>

        <div className="batch-actions">
          <button className="batch-btn retain-btn" onClick={redeemSelected}>Canjear Sel.</button>
          <button className="batch-btn sell-btn" onClick={sellSelected}>Vender Sel.</button>
          <button className="batch-btn retain-btn" onClick={redeemAll}>Canjear Todo</button>
          <button className="batch-btn sell-btn" onClick={sellAll}>Vender Todo</button>
        </div>
      </div>
      
      <div className="cards-grid">
        <div className="rarity-section">
          <h3 className="rarity-title rare-title">Raras / Míticas</h3>
          <div className="card-row">
            {rares.map(c => <CardDisplay key={c.id} card={c} onToggleSelect={toggleSelect} />)}
          </div>
        </div>
        
        <div className="rarity-section">
          <h3 className="rarity-title uncommon-title">Infrecuentes</h3>
          <div className="card-row">
            {uncommons.map(c => <CardDisplay key={c.id} card={c} onToggleSelect={toggleSelect} />)}
          </div>
        </div>

        <div className="rarity-section">
          <h3 className="rarity-title common-title">Comunes & Tokens</h3>
          <div className="card-row">
            {commons.concat(tokens).map(c => <CardDisplay key={c.id} card={c} onToggleSelect={toggleSelect} />)}
          </div>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && createPortal(
        <div className="tutorial-overlay" onClick={dismissTutorial}>
          <div className="tutorial-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={dismissTutorial} aria-label="Cerrar">
              <X size={24} />
            </button>
            <h2>✨ Guía Rápida</h2>
            <ul className="tutorial-list">
              <li><strong>Elegir:</strong> Haz clic en cualquier carta para seleccionarla (verás un ✔ azul).</li>
              <li><strong>Canjear:</strong> Pide el envío físico a tu casa de las cartas seleccionadas o pulsa "Canjear Todo" para recibir las restantes.</li>
              <li><strong>Vender:</strong> Intercambia al instante las cartas elegidas por saldo para tu cuenta.</li>
            </ul>
            <button className="buy-button" onClick={dismissTutorial}>¡Entendido, a abrir sobres!</button>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Alert/Confirm/Prompt Modal */}
      {modalConfig && createPortal(
        <div className="tutorial-overlay" onClick={modalConfig.onCancel}>
          <div className="tutorial-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={modalConfig.onCancel} aria-label="Cerrar">
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>{modalConfig.title}</h2>
            <p style={{ marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: 'var(--text-muted)' }}>{modalConfig.message}</p>
            
            {modalConfig.type === 'prompt' && (
              <input
                type="text"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  marginBottom: '1.5rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') modalConfig.onConfirm(promptValue);
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              {modalConfig.type !== 'alert' && (
                <button
                  className="batch-btn retain-btn"
                  onClick={modalConfig.onCancel}
                >
                  {modalConfig.cancelText}
                </button>
              )}
              <button
                className="batch-btn sell-btn"
                onClick={() => {
                  if (modalConfig.type === 'prompt') {
                    modalConfig.onConfirm(promptValue);
                  } else {
                    modalConfig.onConfirm();
                  }
                }}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Inventory;
