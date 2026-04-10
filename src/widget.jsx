import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Widget entry point to be embedded in other MTG single sites
window.mountMythicBoosterWidget = (elementId) => {
  const container = document.getElementById(elementId);
  if (container) {
    ReactDOM.createRoot(container).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error(`Container with id "${elementId}" not found for MythicBoosterWidget.`);
  }
};
