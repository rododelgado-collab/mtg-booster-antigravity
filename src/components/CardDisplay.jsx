import { useState, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import './CardDisplay.css';
import { Check, Coins, Package, ImageOff, ZoomIn } from 'lucide-react';

// Dimensiones reales de las imágenes de Scryfall (tamaño "normal")
const IMG_WIDTH = 488;
const IMG_HEIGHT = 680;

const CardDisplay = ({ card, onToggleSelect, index = 0, onZoom }) => {
  const [tiltStyle, setTiltStyle] = useState({});
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const isProcessed = card.status === 'SOLD' || card.status === 'REDEEMED';

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    // Capturar rect en el momento del evento, antes del RAF
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
        transition: 'none',
      });
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // Limpiar el estilo inline para que el CSS de la clase (p.ej. .selected) tome el control
    setTiltStyle({});
  };

  const handleTouchStart = () => {
    if (isProcessed) return;
    setTiltStyle({ transform: 'scale(1.04)', transition: 'transform 0.15s ease' });
  };

  const handleTouchEnd = () => {
    // Limpiar estilo inline igual que en handleMouseLeave para no sobreescribir .selected
    setTiltStyle({});
  };

  return (
    <div
      className={`card-container ${!card.status ? 'card-container--animate' : ''}`}
      style={{ '--card-index': index }}
    >
      <div className="card-info glass">
        <p className="card-name">{card.name}</p>
        <p className="card-price">${card.price.toFixed(2)}</p>
        {onZoom && (
          <button
            className="zoom-btn"
            type="button"
            aria-label={`Ver ${card.name} a tamaño completo`}
            onClick={(e) => { e.stopPropagation(); onZoom(); }}
          >
            <ZoomIn size={14} />
          </button>
        )}
      </div>

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
            width={IMG_WIDTH}
            height={IMG_HEIGHT}
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

    </div>
  );
};

CardDisplay.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    rarity: PropTypes.string.isRequired,
    isSelected: PropTypes.bool,
    status: PropTypes.oneOf([null, 'SOLD', 'REDEEMED']),
  }).isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  index: PropTypes.number,
  onZoom: PropTypes.func,
};

export default memo(CardDisplay);
