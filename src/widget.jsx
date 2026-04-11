import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
// Importa solo variables CSS y .glass, sin resets globales de body/html/*
// para no interferir con los estilos del sitio anfitrión.
import './widget-base.css';

// Widget entry point to be embedded in other MTG single sites
window.mountMythicBoosterWidget = (elementId) => {
  const container = document.getElementById(elementId);
  if (container) {
    ReactDOM.createRoot(container).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } else {
    console.error(`Container with id "${elementId}" not found for MythicBoosterWidget.`);
  }
};
