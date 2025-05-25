import React, { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface PdfExtractionWarningProps {
  extractionStatus: 'success' | 'fallback' | 'failed' | 'unknown';
  extractionMethod?: string;
  textLength?: number;
  filename?: string;
  fileSize?: number;
}

/**
 * Component to display warnings about PDF extraction issues
 */
const PdfExtractionWarning: React.FC<PdfExtractionWarningProps> = ({
  extractionStatus,
  extractionMethod,
  textLength,
  filename,
  fileSize
}) => {
  // If extraction was successful, don't show any warning
  if (extractionStatus === 'success') {
    return null;
  }

  // Determine icon, color, and message based on extraction status
  let icon: ReactNode = <Info className="h-5 w-5" />;
  let bgColor = 'bg-blue-50';
  let textColor = 'text-blue-800';
  let borderColor = 'border-blue-300';
  let title = 'Information';
  let message = '';

  if (extractionStatus === 'fallback') {
    icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    bgColor = 'bg-yellow-50';
    textColor = 'text-yellow-800';
    borderColor = 'border-yellow-300';
    title = 'PDF Extraction Warning';
    message = `Primary text extraction failed. Used ${extractionMethod || 'fallback'} method instead. Text quality may be reduced.`;
  } else if (extractionStatus === 'failed') {
    icon = <AlertCircle className="h-5 w-5 text-red-500" />;
    bgColor = 'bg-red-50';
    textColor = 'text-red-800';
    borderColor = 'border-red-300';
    title = 'PDF Extraction Failed';
    message = 'Could not extract text from this PDF. It may be secured, corrupted, or contain only images.';
  } else {
    icon = <Info className="h-5 w-5 text-blue-500" />;
    title = 'PDF Status Unknown';
    message = 'PDF extraction status could not be determined.';
  }

  // Additional details for displaying
  const fileDetails: string[] = [];
  if (filename) {
    fileDetails.push(`File: ${filename}`);
  }
  if (fileSize && fileSize > 0) {
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    fileDetails.push(`Size: ${fileSizeMB} MB`);
  }
  if (textLength !== undefined) {
    fileDetails.push(`Characters: ${textLength.toLocaleString()}`);
  }
  if (extractionMethod) {
    fileDetails.push(`Method: ${extractionMethod}`);
  }

  const detailsText = fileDetails.length > 0 ? fileDetails.join(' | ') : '';

  return (
    <div className={`p-4 mb-4 border rounded-lg ${bgColor} ${borderColor}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ms-3">
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          <div className={`mt-1 text-sm ${textColor}`}>
            <p>{message}</p>
            {detailsText && (
              <p className="mt-1 text-xs opacity-80">{detailsText}</p>
            )}
          </div>
          {extractionStatus === 'failed' && (
            <div className="mt-2">
              <ul className="list-disc list-inside text-xs space-y-1 text-red-700">
                <li>Try converting the PDF to a different format</li>
                <li>Ensure the PDF is not password protected</li>
                <li>If the PDF contains only images, OCR processing may be required</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfExtractionWarning; 