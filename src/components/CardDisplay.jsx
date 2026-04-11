import { useState, useRef } from 'react';
import './CardDisplay.css';
import { Check, Coins, Package, ImageOff } from 'lucide-react';

const CardDisplay = ({ card, onToggleSelect }) => {
  const [tiltStyle, setTiltStyle] = useState({});
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    // Capturar rect antes del RAF, en el momento exacto del evento
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
        transition: 'none'
      });
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTiltStyle({
      transform: `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s ease'
    });
  };

  const handleTouchStart = () => {
    if (isProcessed) return;
    setTiltStyle({ transform: 'scale(1.04)', transition: 'transform 0.15s ease' });
  };

  const handleTouchEnd = () => {
    setTiltStyle({ transform: 'scale(1)', transition: 'transform 0.3s ease' });
  };

  const isProcessed = card.status === 'SOLD' || card.status === 'REDEEMED';

  return (
    <div className="card-container">
      <div
        className={`mtg-card ${card.isSelected ? 'selected' : ''} ${isProcessed ? 'processed' : ''}`}
        ref={cardRef}
        role={isProcessed ? undefined : 'button'}
        aria-label={`${card.name}, valor $${card.price.toFixed(2)}${card.isSelected ? ', seleccionada' : ''}`}
        aria-pressed={!isProcessed ? card.isSelected : undefined}
        tabIndex={isProcessed ? -1 : 0}
        onKeyDown={(e) => {
          if (!isProcessed && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onToggleSelect(card.id);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (!isProcessed) onToggleSelect(card.id); }}
        style={tiltStyle}
      >
        {imgError ? (
          <div className="card-image-fallback">
            <ImageOff size={40} />
            <span>{card.name}</span>
          </div>
        ) : (
          <img
            src={card.image}
            alt={card.name}
            className="card-image"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
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
