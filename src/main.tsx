import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles.css';

document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}
