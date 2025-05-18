import { preloadAnimation } from '../components/UI/LottieAnimation';

// Animation URLs centralized for easy management
export const LOADER_ANIMATION = 'https://lottie.host/68173458-1bd3-49fe-95ae-16bf49bad50f/VJ202RZw6w.json';
//export const LOADER_ANIMATION = 'https://lottie.host/e9916e95-7e58-4d2b-9219-bae0aeaa3de2/XtbtJzrBuq.json';
export const UPGRADE_DIALOG_ANIMATION = 'https://lottie.host/20d3c861-4ac4-4b8d-a439-926406ad7932/qxhZwcIEia.json';
export const TEAM_CREATION_ANIMATION = 'https://lottie.host/a5466e08-210b-4c24-926a-5e2d6364ed4d/U3Te2Zp4nL.json';

// Add more animations here as needed

/**
 * Preload all animations used in the application
 * Call this function early in the application lifecycle to ensure animations are ready when needed
 */
export const preloadAllAnimations = (): void => {
  // Preload each animation
  preloadAnimation(LOADER_ANIMATION);
  preloadAnimation(UPGRADE_DIALOG_ANIMATION);
  preloadAnimation(TEAM_CREATION_ANIMATION);
  
  // Add more animations here as they are added to the application
  
  console.log('All animations preloaded successfully');
}; 