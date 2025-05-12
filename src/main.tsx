import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initDocumentsStorage } from './lib/supabaseInit';
import { preloadAllAnimations } from './utils/animationPreloader';

// Preload animations as early as possible
preloadAllAnimations();

// Initialize Supabase document storage
const init = async () => {
  try {
    const initialized = await initDocumentsStorage();
    if (!initialized) {
      console.error('Failed to initialize document storage. Some features may not work properly.');
    }
  } catch (error) {
    console.error('Failed to initialize document storage:', error);
  }

  // Create root and render app
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

init();
