import { Capacitor } from '@capacitor/core';
import { DocumentScanner } from '@capacitor-mlkit/document-scanner';

export interface ScanResult {
  pages: File[];
  pdfBlob?: Blob;
}

export const ScannerService = {
  async scanNative(): Promise<ScanResult | null> {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const { scannedImages, pdf } = await DocumentScanner.scanDocument({
        pageLimit: 20,
        galleryImportAllowed: true,
        resultFormats: 'JPEG_PDF'
      });

      if (!scannedImages || scannedImages.length === 0) return null;

      // Convert JPEGs
      const pages = await Promise.all(
        scannedImages.map(async (pageUrl: string, i: number) => {
          const webPath = Capacitor.convertFileSrc(pageUrl);
          const res = await fetch(webPath);
          const blob = await res.blob();
          return new File([blob], `scan-${Date.now()}-${i}.jpeg`, { type: 'image/jpeg' });
        })
      );

      // Convert PDF if available
      let pdfBlob: Blob | undefined = undefined;
      if (pdf) {
        const webPath = Capacitor.convertFileSrc(pdf.uri);
        const res = await fetch(webPath);
        pdfBlob = await res.blob();
      }

      return { pages, pdfBlob };
    } catch (err: any) {
      if (err.message === 'CANCELED') {
        return null;
      }
      throw err;
    }
  }
};



