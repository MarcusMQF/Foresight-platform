/**
 * Create blob URL for PDF data
 * @param data PDF data as ArrayBuffer or Blob
 * @returns Blob URL for the PDF
 */
export const createPdfBlobUrl = (data: ArrayBuffer | Blob): string => {
  const blob = data instanceof Blob 
    ? new Blob([data], { type: 'application/pdf' }) 
    : new Blob([data], { type: 'application/pdf' });
  
  return URL.createObjectURL(blob);
};

/**
 * Clean up a blob URL
 * @param url The blob URL to revoke
 */
export const revokePdfBlobUrl = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}; 