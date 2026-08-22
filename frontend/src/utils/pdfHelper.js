import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use local worker bundled by Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function convertPdfToImages(file, onProgress) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const images = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
        if (onProgress) onProgress(i, pdf.numPages);
        // Yield to the event loop so the UI can update the progress text
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const page = await pdf.getPage(i);

        
        // Use a standard scale
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        
        // Convert to blob and then to File
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        const imageFile = new File([blob], `${file.name}-page-${i}.jpg`, { type: 'image/jpeg' });
        
        images.push(imageFile);
    }
    
    return images;
}
