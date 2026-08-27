import { PDFDocument } from 'pdf-lib';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 18;

export async function compilePagesToPdf(
  canvases: HTMLCanvasElement[],
  title = 'Scanned Document',
  quality = 0.85
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setProducer('Inkto CamScanner Engine');

  for (const canvas of canvases) {
    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());

    const embeddedImage = await pdfDoc.embedJpg(jpegBytes);
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    const usableWidth = A4_WIDTH - MARGIN * 2;
    const usableHeight = A4_HEIGHT - MARGIN * 2;

    const scale = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

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
  quality = 0.88
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) return reject(new Error('Failed to generate image blob'));
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality = 0.88
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) return reject(new Error('Failed to generate image blob'));
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}
