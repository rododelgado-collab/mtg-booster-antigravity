import { useEffect, useRef } from 'react';
import './Confetti.css';

const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#a855f7', '#f97316'];

// Lluvia de confeti animada con CSS, sin dependencias externas
const Confetti = ({ count = 60, duration = 3500 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pieces = Array.from({ length: count }, () => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = [
        `left: ${Math.random() * 100}%`,
        `background-color: ${COLORS[Math.floor(Math.random() * COLORS.length)]}`,
        `animation-delay: ${(Math.random() * 1.5).toFixed(2)}s`,
        `animation-duration: ${(1.8 + Math.random() * 1.5).toFixed(2)}s`,
        `width: ${6 + Math.floor(Math.random() * 8)}px`,
        `height: ${6 + Math.floor(Math.random() * 8)}px`,
        `border-radius: ${Math.random() > 0.5 ? '50%' : '2px'}`,
      ].join(';');
      container.appendChild(el);
      return el;
    });

    const timer = setTimeout(() => {
      pieces.forEach(el => { if (el.parentNode) el.remove(); });
    }, duration);

    return () => {
      clearTimeout(timer);
      pieces.forEach(el => { if (el.parentNode) el.remove(); });
    };
  }, [count, duration]);

  return <div ref={containerRef} className="confetti-container" aria-hidden="true" />;
};

export default Confetti;
