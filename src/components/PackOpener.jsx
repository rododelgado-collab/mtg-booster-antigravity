import { useState } from 'react';
import { PackageOpen, Sparkles } from 'lucide-react';
import { generateBoosterPack } from '../services/scryfall';
import './PackOpener.css';

const PackOpener = ({ onComplete }) => {
  const [opening, setOpening] = useState(false);
  const [statusText, setStatusText] = useState('Click to tear open');

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    setStatusText('Channeling Mana...');

    try {
      const pack = await generateBoosterPack();
      setStatusText('Revealing Mythics...');
      
      // Artificial delay for the suspense
      setTimeout(() => {
        onComplete(pack);
      }, 2500);

    } catch (err) {
      console.error(err);
      setStatusText('Fizzled! Try again.');
      setOpening(false);
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
          <p className="pack-type">Digital Draft Booster</p>
        </div>
      </div>
      <h3 className={`status-text ${opening ? 'pulsing' : ''}`}>{statusText}</h3>
    </div>
  );
};

export default PackOpener;
