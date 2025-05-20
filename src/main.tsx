import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initDocumentsStorage } from './lib/supabaseInit';
import { preloadAllAnimations } from './utils/animationPreloader';

// Preload animations as early as possible
preloadAllAnimations();

// Initialize Supabase document storage
initDocumentsStorage().then(() => {
  console.log('Successfully initialized Supabase documents storage');
  // Start the app
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
