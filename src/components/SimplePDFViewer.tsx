import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

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
    // Directly use the provided URL if it's a blob URL
    if (isBlobUrl && pdfUrl) {
      setLoading(false);
      return;
    }
    
    if (!pdfUrl) {
      setLoading(false);
      setError('No PDF URL provided');
      if (onError) onError('No PDF URL provided');
      return;
    }

    // Set loading state
    setLoading(true);
    setError(null);
    
  }, [pdfUrl, isBlobUrl, onError]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Handle retry button click
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
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
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-2"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
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