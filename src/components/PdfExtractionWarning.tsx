import React from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

interface PdfExtractionWarningProps {
  status?: 'success' | 'fallback' | 'failed';
  method?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Component to display warnings about PDF extraction issues
 */
const PdfExtractionWarning: React.FC<PdfExtractionWarningProps> = ({ 
  status, 
  method,
  error
}) => {
  if (!status || status === 'success') {
    return null;
  }

  if (status === 'failed') {
    return (
      <Alert 
        severity="error" 
        icon={<ErrorIcon />}
        sx={{ mb: 2 }}
      >
        <AlertTitle>PDF Extraction Failed</AlertTitle>
        <Typography variant="body2">
          {error?.message || 'Unable to extract text from this PDF file.'}
        </Typography>
        <Typography variant="body2" mt={1}>
          Recommendations:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
          <li>Make sure the PDF is not password protected</li>
          <li>Use a digital PDF rather than a scanned document</li>
          <li>Try converting the PDF to a different format</li>
          <li>For scanned documents, run OCR before uploading</li>
        </Box>
      </Alert>
    );
  }

  if (status === 'fallback') {
    return (
      <Alert 
        severity="warning" 
        icon={<WarningIcon />}
        sx={{ mb: 2 }}
      >
        <AlertTitle>Potential Text Quality Issues</AlertTitle>
        <Typography variant="body2">
          The primary text extraction method failed for this PDF. 
          A fallback method ({method || 'alternative'}) was used instead.
        </Typography>
        <Typography variant="body2" mt={1}>
          This may result in lower quality text extraction, which could affect analysis accuracy.
        </Typography>
      </Alert>
    );
  }

  return null;
};

export default PdfExtractionWarning; 