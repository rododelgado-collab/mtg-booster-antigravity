import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import CardDisplay from './CardDisplay';
import { X, HelpCircle } from 'lucide-react';
import './Inventory.css';

const Inventory = ({ cards: initialCards, onGoBack, onAddCredit }) => {
  const [cards, setCards] = useState(initialCards.map(c => ({
    ...c,
    isSelected: c.isSelected ?? false,
    status: c.status ?? null,
  })));

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return localStorage.getItem('hasSeenInventoryTutorial') !== 'true';
    } catch (e) {
      return true;
    }
  });

  const dismissTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem('hasSeenInventoryTutorial', 'true');
    } catch (e) {
      console.warn("No se pudo acceder a localStorage", e);
    }
  };

  // Zoom de carta
  const [zoomedCard, setZoomedCard] = useState(null);

  // Modales asincrónicos
  const [modalConfig, setModalConfig] = useState(null);
  const [promptValue, setPromptValue] = useState('');

  const showConfirm = useCallback((title, message, confirmText = 'Aceptar', cancelText = 'Cancelar') =>
    new Promise((resolve) => {
      setModalConfig({
        type: 'confirm', title, message, confirmText, cancelText,
        onConfirm: () => { setModalConfig(null); resolve(true); },
        onCancel:  () => { setModalConfig(null); resolve(false); },
      });
    }), []);

  const showPrompt = useCallback((title, message) =>
    new Promise((resolve) => {
      setPromptValue('');
      setModalConfig({
        type: 'prompt', title, message,
        confirmText: 'Aceptar', cancelText: 'Cancelar',
        onConfirm: (val) => { setModalConfig(null); resolve(val); },
        onCancel:  () => { setModalConfig(null); resolve(null); },
      });
    }), []);

  const showAlert = useCallback((title, message) =>
    new Promise((resolve) => {
      setModalConfig({
        type: 'alert', title, message, confirmText: 'Entendido',
        onConfirm: () => { setModalConfig(null); resolve(); },
        onCancel:  () => { setModalConfig(null); resolve(); },
      });
    }), []);

  useEffect(() => {
    const allProcessed = cards.length > 0 && cards.every(c => c.status !== null);
    if (!allProcessed) return;

    const redeemedCount = cards.filter(c => c.status === 'REDEEMED').length;
    const soldCount     = cards.filter(c => c.status === 'SOLD').length;

    let finalMessage = '¡Gracias por procesar tu sobre!';
    if (redeemedCount > 0 && soldCount > 0) {
      finalMessage = `Has sumado crédito a tu saldo por tus ventas y las ${redeemedCount} carta(s) física(s) que canjeaste serán preparadas y enviadas a la dirección indicada. ¡Disfruta el botín!`;
    } else if (redeemedCount > 0) {
      finalMessage = '¡Excelente elección para tu colección! Todas las cartas físicas serán empaquetadas y enviadas a la dirección que indicaste a la brevedad.';
    } else if (soldCount > 0) {
      finalMessage = '¡Tremendo negocio! Todas tus cartas del sobre se han vendido y transformado con éxito en crédito instantáneo para tu cuenta.';
    }

    const timer = setTimeout(() => {
      showAlert('¡Sobre Completado!', finalMessage).then(() => onGoBack());
    }, 300);

    return () => clearTimeout(timer);
  }, [cards, onGoBack, showAlert]);

  useEffect(() => {
    try {
      sessionStorage.setItem('mtg_cards', JSON.stringify(cards));
    } catch (e) {
      console.warn("No se pudo guardar en sessionStorage", e);
    }
  }, [cards]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cards.some(c => !c.status)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cards]);

  // Agrupación por rareza
  const commons   = useMemo(() => cards.filter(c => c.rarity === 'common'), [cards]);
  const uncommons = useMemo(() => cards.filter(c => c.rarity === 'uncommon'), [cards]);
  const rares     = useMemo(() => cards.filter(c => c.rarity === 'rare' || c.rarity === 'mythic'), [cards]);
  const tokens    = useMemo(() => cards.filter(c => c.rarity === 'token' || c.type_line?.includes('Token')), [cards]);

  // Filtro por búsqueda
  const totalPackValue = useMemo(() => cards.reduce((acc, c) => acc + c.price, 0), [cards]);

  const selectedCards        = useMemo(() => cards.filter(c => c.isSelected && !c.status), [cards]);
  const selectedTotal        = useMemo(() => selectedCards.reduce((acc, c) => acc + c.price, 0), [selectedCards]);
  const availableCards       = useMemo(() => cards.filter(c => !c.status), [cards]);
  const allAvailableSelected = useMemo(
    () => availableCards.length > 0 && availableCards.every(c => c.isSelected),
    [availableCards]
  );

  const toggleSelect = useCallback((id) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, isSelected: !c.isSelected } : c));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setCards(prev => prev.map(c => c.status ? c : { ...c, isSelected: !allAvailableSelected }));
  }, [allAvailableSelected]);

  const simulateStockCheck = async (cardsToRedeem) => {
    let finalRedeemList = [];
    let convertedValue = 0;

    for (const c of cardsToRedeem) {
      if (Math.random() < 0.15) {
        const convert = await showConfirm(
          'Quiebre de Stock 🚨',
          `¡Oh no! La carta "${c.name}" recién se agotó en nuestras bodegas.\n\n¿Deseas venderla en su lugar y sumar sus $${c.price.toFixed(2)} automáticamente a tu crédito?`,
          'Aceptar Crédito',
          'Conservarla'
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
      await showAlert('Saldo Actualizado', `Se transfirieron exitosamente $${convertedValue.toFixed(2)} a tu cuenta por las cartas sin stock.`);
    }

    return finalRedeemList;
  };

  const sellSelected = async () => {
    const toSell = cards.filter(c => c.isSelected && !c.status);
    if (toSell.length === 0) { await showAlert('Aviso', 'No hay cartas seleccionadas para vender.'); return; }
    const total = toSell.reduce((acc, c) => acc + c.price, 0);
    const confirmed = await showConfirm(
      'Confirmar Venta',
      `¿Estás seguro de que deseas VENDER las ${toSell.length} cartas seleccionadas por un total de $${total.toFixed(2)} de crédito?`
    );
    if (confirmed) {
      setCards(prev => prev.map(c => c.isSelected && !c.status ? { ...c, isSelected: false, status: 'SOLD' } : c));
      onAddCredit(total);
    }
  };

  const redeemSelected = async () => {
    const toRedeem = cards.filter(c => c.isSelected && !c.status);
    if (toRedeem.length === 0) { await showAlert('Aviso', 'No hay cartas seleccionadas para canjear.'); return; }
    const wantsToRedeem = await showConfirm('Confirmar Canje', `¿Estás seguro de que deseas CANJEAR (Físico) las ${toRedeem.length} cartas seleccionadas?`);
    if (!wantsToRedeem) return;

    const valid = await simulateStockCheck(toRedeem);
    if (valid.length === 0) return;

    const useDefault = await showConfirm('Dirección de Envío', `¿Deseas enviar las ${valid.length} cartas en stock a la dirección agregada previamente?`, 'Usar Predeterminada', 'Ingresar Nueva');
    if (!useDefault) {
      const newAddr = await showPrompt('Nueva Dirección', 'Por favor, ingresa la nueva dirección de envío:');
      if (!newAddr || newAddr.trim() === '') { await showAlert('Operación Cancelada', 'Debes especificar una dirección. Se ha cancelado el envío físico.'); return; }
      await showAlert('Éxito', `Las cartas físicas serán enviadas a: ${newAddr}`);
    } else {
      await showAlert('Éxito', 'Las cartas físicas serán enviadas a tu dirección predeterminada.');
    }

    setCards(prev => prev.map(c => valid.find(vc => vc.id === c.id) ? { ...c, isSelected: false, status: 'REDEEMED' } : c));
  };

  const sellAll = async () => {
    const avail = cards.filter(c => !c.status);
    if (avail.length === 0) { await showAlert('Aviso', 'No hay cartas disponibles para vender.'); return; }
    const total = avail.reduce((acc, c) => acc + c.price, 0);
    const confirmed = await showConfirm('Vender Todo', `¿Estás seguro de que deseas VENDER TODAS las ${avail.length} cartas restantes por un total de $${total.toFixed(2)} de crédito?`);
    if (confirmed) {
      setCards(prev => prev.map(c => !c.status ? { ...c, isSelected: false, status: 'SOLD' } : c));
      onAddCredit(total);
    }
  };

  const redeemAll = async () => {
    const avail = cards.filter(c => !c.status);
    if (avail.length === 0) { await showAlert('Aviso', 'No hay cartas disponibles para canjear.'); return; }
    const wantsToRedeem = await showConfirm('Canjear Todo', `¿Estás seguro de que deseas CANJEAR (Físico) TODAS las ${avail.length} cartas restantes?`);
    if (!wantsToRedeem) return;

    const valid = await simulateStockCheck(avail);
    if (valid.length === 0) return;

    const useDefault = await showConfirm('Dirección de Envío', `¿Deseas enviar las ${valid.length} cartas en stock a la dirección agregada previamente?`, 'Usar Predeterminada', 'Ingresar Nueva');
    if (!useDefault) {
      const newAddr = await showPrompt('Nueva Dirección', 'Por favor, ingresa la nueva dirección de envío:');
      if (!newAddr || newAddr.trim() === '') { await showAlert('Operación Cancelada', 'Debes especificar una dirección. Se ha cancelado la operación.'); return; }
      await showAlert('Éxito', `Las cartas físicas serán enviadas a: ${newAddr}`);
    } else {
      await showAlert('Éxito', 'Las cartas físicas serán enviadas a tu dirección predeterminada.');
    }

    setCards(prev => prev.map(c => valid.find(vc => vc.id === c.id) ? { ...c, isSelected: false, status: 'REDEEMED' } : c));
  };

  return (
    <div className="inventory-view">
      <div className="inventory-header">
        <div className="pack-summary glass">
          <span className="summary-label">Valor del Sobre: </span>
          <span className="summary-value text-gold">${totalPackValue.toFixed(2)}</span>
          <button
            className="help-button"
            onClick={() => setShowTutorial(true)}
            title="Ver Guía de Uso"
            type="button"
          >
            <HelpCircle size={22} />
          </button>
        </div>

        <div className="header-right">
        {/* Siempre renderizado para evitar que el layout del header se desplace al aparecer */}
        <div className={`selection-summary glass${selectedCards.length === 0 ? ' selection-summary--hidden' : ''}`}>
          <span className="selection-count">
            {selectedCards.length} seleccionada{selectedCards.length !== 1 ? 's' : ''}
          </span>
          <span className="summary-value text-gold">${selectedTotal.toFixed(2)}</span>
        </div>

        <div className="batch-actions">
          <button
            className={`batch-btn batch-btn--full ${allAvailableSelected ? 'sell-btn' : 'retain-btn'}`}
            onClick={toggleSelectAll}
            disabled={availableCards.length === 0}
          >
            {allAvailableSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </button>
          <button className="batch-btn retain-btn" onClick={redeemSelected}>Canjear Sel.</button>
          <button className="batch-btn sell-btn" onClick={sellSelected}>Vender Sel.</button>
          <button className="batch-btn retain-btn" onClick={redeemAll}>Canjear Todo</button>
          <button className="batch-btn sell-btn" onClick={sellAll}>Vender Todo</button>
        </div>
        </div>
      </div>

      <div className="cards-grid">
        {rares.length > 0 && (
          <div className="rarity-section">
            <h3 className="rarity-title rare-title">Raras / Míticas</h3>
            <div className="card-row">
              {rares.map((c, i) => (
                <CardDisplay
                  key={c.id}
                  card={c}
                  onToggleSelect={toggleSelect}
                  index={i}
                  onZoom={() => setZoomedCard(c)}
                />
              ))}
            </div>
          </div>
        )}

        {uncommons.length > 0 && (
          <div className="rarity-section">
            <h3 className="rarity-title uncommon-title">Infrecuentes</h3>
            <div className="card-row">
              {uncommons.map((c, i) => (
                <CardDisplay
                  key={c.id}
                  card={c}
                  onToggleSelect={toggleSelect}
                  index={i}
                  onZoom={() => setZoomedCard(c)}
                />
              ))}
            </div>
          </div>
        )}

        {(commons.length > 0 || tokens.length > 0) && (
          <div className="rarity-section">
            <h3 className="rarity-title common-title">Comunes & Tokens</h3>
            <div className="card-row">
              {commons.concat(tokens).map((c, i) => (
                <CardDisplay
                  key={c.id}
                  card={c}
                  onToggleSelect={toggleSelect}
                  index={i}
                  onZoom={() => setZoomedCard(c)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom lightbox */}
      {zoomedCard && createPortal(
        <div className="zoom-overlay" onClick={() => setZoomedCard(null)} role="dialog" aria-modal="true" aria-label={`Vista ampliada de ${zoomedCard.name}`}>
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn zoom-close" onClick={() => setZoomedCard(null)} aria-label="Cerrar vista ampliada">
              <X size={28} />
            </button>
            <img
              src={zoomedCard.image}
              alt={zoomedCard.name}
              className="zoom-image"
            />
            <p className="zoom-card-name">{zoomedCard.name}</p>
          </div>
        </div>,
        document.body
      )}

      {/* Tutorial */}
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

      {/* Modales asincrónicos */}
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
                  width: '100%', padding: '1rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)',
                  color: 'white', marginBottom: '1.5rem', fontSize: '1rem', fontFamily: 'inherit',
                }}
                maxLength={200}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') modalConfig.onConfirm(promptValue); }}
              />
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              {modalConfig.type !== 'alert' && (
                <button className="batch-btn retain-btn" onClick={modalConfig.onCancel}>
                  {modalConfig.cancelText}
                </button>
              )}
              <button
                className="batch-btn sell-btn"
                onClick={() => modalConfig.type === 'prompt' ? modalConfig.onConfirm(promptValue) : modalConfig.onConfirm()}
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

Inventory.propTypes = {
  cards: PropTypes.array.isRequired,
  onGoBack: PropTypes.func.isRequired,
  onAddCredit: PropTypes.func.isRequired,
};

export default Inventory;
