import { useState, useRef } from 'react';
import './CardDisplay.css';
import { Check, Coins, Package } from 'lucide-react';

const CardDisplay = ({ card, onToggleSelect }) => {
  const [tiltStyle, setTiltStyle] = useState({});
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      transition: 'none'
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s ease'
    });
  };

  const isProcessed = card.status === 'SOLD' || card.status === 'REDEEMED';

  return (
    <div className="card-container">
      <div 
        className={`mtg-card ${card.isSelected ? 'selected' : ''} ${isProcessed ? 'processed' : ''}`}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => { if (!isProcessed) onToggleSelect(card.id); }}
        style={tiltStyle}
      >
        <img src={card.image} alt={card.name} className="card-image" loading="lazy" />
        <div className="card-glare"></div>
        
        {card.isSelected && !isProcessed && (
          <div className="selection-overlay">
            <Check size={48} className="check-icon" />
          </div>
        )}

        {card.status === 'SOLD' && (
          <div className="status-badge sold-badge">
            <Coins size={16} /> Vendida
          </div>
        )}
        {card.status === 'REDEEMED' && (
          <div className="status-badge redeemed-badge">
            <Package size={16} /> Canjeada
          </div>
        )}
      </div>
      
      <div className="card-actions glass">
        <p className="card-price">Valor: ${card.price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default CardDisplay;
