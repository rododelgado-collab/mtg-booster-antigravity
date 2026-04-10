import { useState, useEffect } from 'react';
import CardDisplay from './CardDisplay';
import { ArrowLeft } from 'lucide-react';
import './Inventory.css';

const Inventory = ({ cards: initialCards, onGoBack, onAddCredit }) => {
  const [cards, setCards] = useState(initialCards.map(c => ({...c, isSelected: false, status: null})));

  useEffect(() => {
    const allProcessed = cards.length > 0 && cards.every(c => c.status !== null);
    if (allProcessed) {
      setTimeout(() => {
        alert("¡Gracias por procesar tu sobre! Tus cartas han sido registradas.");
        onGoBack();
      }, 300); // Pequeno timeout visual
    }
  }, [cards, onGoBack]);

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

  const sellSelected = () => {
    const selectedCards = cards.filter(c => c.isSelected && !c.status);
    if (selectedCards.length === 0) {
      alert("No cards selected for selling.");
      return;
    }
    
    const totalToSell = selectedCards.reduce((acc, c) => acc + c.price, 0);
    
    if (window.confirm(`¿Estás seguro de que deseas VENDER las ${selectedCards.length} cartas seleccionadas por un total de $${totalToSell.toFixed(2)} de crédito?`)) {
      setCards(prev => prev.map(c => {
        if (c.isSelected && !c.status) {
          return { ...c, isSelected: false, status: 'SOLD' };
        }
        return c;
      }));
      onAddCredit(totalToSell);
    }
  };

  const redeemSelected = () => {
    const selectedCards = cards.filter(c => c.isSelected && !c.status);
    if (selectedCards.length === 0) {
      alert("No hay cartas seleccionadas para canjear.");
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas CANJEAR (Físico) las ${selectedCards.length} cartas seleccionadas?`)) {
      if (!window.confirm('¿Deseas enviar las cartas a la dirección agregada previamente?\n\n(Pulsa "Aceptar" para usar la predeterminada o "Cancelar" para ingresar una nueva)')) {
        const newAddress = window.prompt('Por favor, ingresa la nueva dirección de envío:');
        if (!newAddress) {
          alert('Operación cancelada. Debes especificar una dirección.');
          return;
        }
        alert(`Éxito. Las cartas serán enviadas a: ${newAddress}`);
      } else {
        alert('Éxito. Las cartas serán enviadas a tu dirección predeterminada.');
      }

      setCards(prev => prev.map(c => {
        if (c.isSelected && !c.status) {
          return { ...c, isSelected: false, status: 'REDEEMED' };
        }
        return c;
      }));
    }
  };

  const sellAll = () => {
    const availableCards = cards.filter(c => !c.status);
    if (availableCards.length === 0) {
      alert("No hay cartas disponibles para vender.");
      return;
    }
    
    const totalToSell = availableCards.reduce((acc, c) => acc + c.price, 0);
    
    if (window.confirm(`¿Estás seguro de que deseas VENDER TODAS las ${availableCards.length} cartas restantes por un total de $${totalToSell.toFixed(2)} de crédito?`)) {
      setCards(prev => prev.map(c => !c.status ? { ...c, isSelected: false, status: 'SOLD' } : c));
      onAddCredit(totalToSell);
    }
  };

  const redeemAll = () => {
    const availableCards = cards.filter(c => !c.status);
    if (availableCards.length === 0) {
      alert("No hay cartas disponibles para canjear.");
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas CANJEAR (Físico) TODAS las ${availableCards.length} cartas restantes?`)) {
      if (!window.confirm('¿Deseas enviar las cartas a la dirección agregada previamente?\n\n(Pulsa "Aceptar" para usar la predeterminada o "Cancelar" para ingresar una nueva)')) {
        const newAddress = window.prompt('Por favor, ingresa la nueva dirección de envío:');
        if (!newAddress) {
          alert('Operación cancelada. Debes especificar una dirección.');
          return;
        }
        alert(`Éxito. Las cartas serán enviadas a: ${newAddress}`);
      } else {
        alert('Éxito. Las cartas serán enviadas a tu dirección predeterminada.');
      }

      setCards(prev => prev.map(c => !c.status ? { ...c, isSelected: false, status: 'REDEEMED' } : c));
    }
  };

  const totalPackValue = cards.reduce((acc, card) => acc + card.price, 0);

  return (
    <div className="inventory-view">
      <div className="inventory-header">
        <button className="back-button glass" onClick={onGoBack}>
          <ArrowLeft size={20} />
          <span>Back to Store</span>
        </button>

        <div className="pack-summary glass">
          <span className="summary-label">Total Pack Value: </span>
          <span className="summary-value text-gold">${totalPackValue.toFixed(2)}</span>
        </div>

        <div className="batch-actions">
          <button className="batch-btn retain-btn" onClick={redeemSelected}>Canjear Sel.</button>
          <button className="batch-btn retain-btn" onClick={redeemAll}>Canjear Todo</button>
          <button className="batch-btn sell-btn" onClick={sellSelected}>Vender Sel.</button>
          <button className="batch-btn sell-btn" onClick={sellAll}>Vender Todo</button>
        </div>
      </div>
      
      <div className="cards-grid">
        <div className="rarity-section">
          <h3 className="rarity-title rare-title">Rare / Mythic</h3>
          <div className="card-row">
            {rares.map(c => <CardDisplay key={c.id} card={c} onToggleSelect={toggleSelect} />)}
          </div>
        </div>
        
        <div className="rarity-section">
          <h3 className="rarity-title uncommon-title">Uncommons</h3>
          <div className="card-row">
            {uncommons.map(c => <CardDisplay key={c.id} card={c} onToggleSelect={toggleSelect} />)}
          </div>
        </div>

        <div className="rarity-section">
          <h3 className="rarity-title common-title">Commons & Tokens</h3>
          <div className="card-row">
            {commons.concat(tokens).map(c => <CardDisplay key={c.id} card={c} onToggleSelect={toggleSelect} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
