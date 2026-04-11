import { useState } from 'react';
import PropTypes from 'prop-types';
import { PackageOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { generateBoosterPack } from '../services/scryfall';
import './PackOpener.css';

const PackOpener = ({ onComplete, onBack }) => {
  const [opening, setOpening] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [statusText, setStatusText] = useState('Haz clic para abrir el sobre');

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    setHasError(false);
    setStatusText('Canalizando Maná...');

    try {
      const pack = await generateBoosterPack();
      setStatusText('Revelando Míticas...');
      setTimeout(() => {
        onComplete(pack);
      }, 2500);
    } catch (err) {
      console.error(err);
      setStatusText('¡El hechizo falló! Intenta de nuevo.');
      setOpening(false);
      setHasError(true);
    }
  };

  return (
    <div className="pack-opener-view">
      <div
        className={`booster-pack glass ${opening ? 'opening-anim' : 'hover-anim'}`}
        onClick={handleOpen}
      >
        <div className="pack-design">
          {opening ? (
            <Sparkles size={80} className="text-gold spark-anim" />
          ) : (
            <PackageOpen size={80} className="text-blue" />
          )}
          <h2 className="pack-title">Bloomburrow</h2>
          <p className="pack-type">Sobre Digital de Draft</p>
        </div>
      </div>

      <h3 className={`status-text ${opening ? 'pulsing' : ''}`}>{statusText}</h3>

      {hasError && (
        <button className="back-button glass pack-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Volver a la Tienda</span>
        </button>
      )}
    </div>
  );
};

PackOpener.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default PackOpener;
