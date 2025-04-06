import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css'; // We'll create this for basic styling

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);