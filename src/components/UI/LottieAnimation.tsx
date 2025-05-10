import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';

// Animation cache to avoid fetching the same animation multiple times
const animationCache: Record<string, any> = {};

// Preload animations in advance
export function preloadAnimation(url: string): void {
  if (!animationCache[url]) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        animationCache[url] = data;
      })
      .catch(error => {
        console.error('Failed to preload animation:', error);
      });
  }
}

interface LottieAnimationProps {
  animationUrl: string;
  width?: number;
  height?: number;
  className?: string;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ 
  animationUrl,
  width = 40, 
  height = 40,
  className = ''
}) => {
  const [animationData, setAnimationData] = useState<any>(animationCache[animationUrl] || null);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    // If animation is already in cache, use it immediately
    if (animationCache[animationUrl]) {
      setAnimationData(animationCache[animationUrl]);
      return;
    }
    
    // Otherwise fetch it
    const fetchAnimation = async () => {
      try {
        const response = await fetch(animationUrl);
        const data = await response.json();
        if (mountedRef.current) {
          animationCache[animationUrl] = data;
          setAnimationData(data);
        }
      } catch (error) {
        console.error('Failed to load animation:', error);
      }
    };
    
    fetchAnimation();
    
    return () => {
      mountedRef.current = false;
    };
  }, [animationUrl]);
  
  if (!animationData) {
    return <div style={{ width, height }} className={className}></div>;
  }

  return (
    <div style={{ width, height }} className={className}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice'
        }}
      />
    </div>
  );
};

export default LottieAnimation; 