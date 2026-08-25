/* eslint-disable */
// @ts-nocheck
'use client';
import * as pdfjsLib from 'pdfjs-dist';


// Use local worker bundled by Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function convertPdfToImages(file, onProgress) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const images = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
        if (onProgress) onProgress(i, pdf.numPages);
        // Yield to the event loop so the UI can update the progress text
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const page = await pdf.getPage(i);

        
        // Render above final upload size so compression keeps enough stroke
        // detail without creating slow, oversized serverless payloads.
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
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        if (!blob) throw new Error(`Could not render page ${i}`);
        const imageFile = new File([blob], `${file.name}-page-${i}.jpg`, { type: 'image/jpeg' });
        
        images.push(imageFile);

        canvas.width = 0;
        canvas.height = 0;
    }
    
    return images;
}
