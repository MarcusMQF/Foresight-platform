import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import LottieAnimation from './UI/LottieAnimation';
import { LOADER_ANIMATION } from '../utils/animationPreloader';

interface SimplePDFViewerProps {
  pdfUrl: string | null;
  onError?: (error: string) => void;
}

const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({ pdfUrl, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const maxRetries = 3;

  // Check if pdfUrl is already a blob URL (created elsewhere)
  const isBlobUrl = pdfUrl?.startsWith('blob:') ?? false;

  useEffect(() => {
    // Reset state when pdfUrl changes
    setLoading(true);
    setError(null);
    
    if (!pdfUrl) {
      setLoading(false);
      setError('No PDF URL provided');
      if (onError) onError('No PDF URL provided');
      return;
    }

    // Handle iframe error through event listener
    const handleIframeError = () => {
      console.error("PDF iframe failed to load:", pdfUrl);
      setLoading(false);
      const errorMessage = "Failed to load PDF. The file may be corrupted or inaccessible.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    };

    // Add event listener to iframe
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('error', handleIframeError);
    }

    return () => {
      // Clean up event listener
      if (iframe) {
        iframe.removeEventListener('error', handleIframeError);
      }
    };
  }, [pdfUrl, onError]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    console.log("PDF iframe loaded successfully");
    setLoading(false);
    setError(null);
  };

  // Handle retry button click
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      console.log(`Retrying PDF load attempt ${retryCount + 1} of ${maxRetries}`);
      setRetryCount(prev => prev + 1);
      setLoading(true);
      setError(null);
      
      // Force iframe refresh by recreating it
      if (iframeRef.current) {
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = "about:blank";
        setTimeout(() => {
          if (iframeRef.current) iframeRef.current.src = currentSrc;
        }, 100);
      }
    }
  };

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No PDF available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-10">
          <LottieAnimation 
            animationUrl={LOADER_ANIMATION} 
            width={80} 
            height={80} 
            className="opacity-75" 
          />
        </div>
      )}
      
      {error ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <p className="text-red-500 mb-3">{error}</p>
          {retryCount < maxRetries && (
            <button 
              onClick={handleRetry}
              className="flex items-center px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
            >
              <RefreshCw size={14} className="mr-2" />
              Retry ({retryCount + 1}/{maxRetries})
            </button>
          )}
        </div>
      ) : (
        <iframe 
          ref={iframeRef}
          src={pdfUrl}
          className="flex-1 w-full border-0"
          style={{ backgroundColor: '#f5f5f5' }}
          title="PDF Viewer"
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
};

export default SimplePDFViewer; 