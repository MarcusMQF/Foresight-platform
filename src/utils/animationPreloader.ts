import { preloadAnimation } from '../components/UI/LottieAnimation';

// Animation URLs centralized for easy management
export const DOT_LOADER_ANIMATION = 'https://lottie.host/716b9035-34f7-4175-827b-b0d7c5fba029/UVzLS3DVMa.json';
export const UPGRADE_DIALOG_ANIMATION = 'https://lottie.host/20d3c861-4ac4-4b8d-a439-926406ad7932/qxhZwcIEia.json';

// Add more animations here as needed

/**
 * Preload all animations used in the application
 * Call this function early in the application lifecycle to ensure animations are ready when needed
 */
export const preloadAllAnimations = (): void => {
  // Preload each animation
  preloadAnimation(DOT_LOADER_ANIMATION);
  preloadAnimation(UPGRADE_DIALOG_ANIMATION);
  
  // Add more animations here as they are added to the application
  
  console.log('All animations preloaded successfully');
}; 