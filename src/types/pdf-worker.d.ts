declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const workerSrc: string;
  export default workerSrc;
}

declare module "pdfjs-dist/legacy/build/pdf" {
  export * from "pdfjs-dist";
}

declare module "pdfjs-dist/legacy/web/pdf_viewer" {
  export * from "pdfjs-dist/web/pdf_viewer";
} 