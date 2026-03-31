declare module 'html2canvas' {
  interface Html2CanvasOptions {
    backgroundColor?: string | null;
    logging?: boolean;
    scale?: number;
  }

  function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>;

  export default html2canvas;
}

declare module 'jspdf' {
  interface JsPdfOptions {
    orientation?: 'portrait' | 'landscape' | 'p' | 'l';
    unit?: string;
    format?: string | number[];
  }

  class jsPDF {
    constructor(options?: JsPdfOptions);
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number
    ): void;
    addPage(): void;
    save(filename: string): void;
  }

  export default jsPDF;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
