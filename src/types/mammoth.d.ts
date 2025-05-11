declare module 'mammoth' {
  interface MammothOptions {
    arrayBuffer: ArrayBuffer;
  }
  
  interface MammothResult {
    value: string;
  }

  export function extractRawText(options: MammothOptions): Promise<MammothResult>;
} 