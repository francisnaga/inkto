import { PDFDocument } from 'pdf-lib';

// A4 dimensions in points (72 points/inch)
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 20; // 20pt margin for clean legal document borders

export async function compilePdfFromCanvases(
  canvases: HTMLCanvasElement[],
  title = 'scanned-document'
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setProducer('Inkto Legal Scanner');

  for (const canvas of canvases) {
    // Export canvas as JPEG blob/arraybuffer
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.90);
    const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());

    const embeddedImage = await pdfDoc.embedJpg(jpegBytes);
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    // Available page area
    const usableWidth = A4_WIDTH - MARGIN * 2;
    const usableHeight = A4_HEIGHT - MARGIN * 2;

    // Calculate scale to fit page while maintaining aspect ratio
    const scale = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    // Center image on the page
    const x = (A4_WIDTH - scaledWidth) / 2;
    const y = (A4_HEIGHT - scaledHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality = 0.92
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          return reject(new Error('Failed to export canvas to file'));
        }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      quality
    );
  });
}
