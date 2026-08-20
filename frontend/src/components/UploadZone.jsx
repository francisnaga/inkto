import React, { useRef, useState } from 'react';
import { Camera, Upload, File as FileIcon } from 'lucide-react';
import { convertPdfToImages } from '../utils/pdfHelper';

export default function UploadZone({ onFilesSelected }) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!isProcessing) setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const processFiles = async (fileList) => {
        setIsProcessing(true);
        try {
            const finalFiles = [];
            for (const file of fileList) {
                if (file.type === 'application/pdf') {
                    const images = await convertPdfToImages(file);
                    finalFiles.push(...images);
                } else {
                    finalFiles.push(file);
                }
            }
            onFilesSelected(finalFiles);
        } catch (err) {
            console.error("Failed to process files", err);
            alert("Failed to process PDF. Please try uploading images directly.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(Array.from(e.target.files));
        }
        e.target.value = ''; // Reset for consecutive uploads
    };

    return (
        <div 
            className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div style={{ marginBottom: '16px' }}>
                <FileIcon size={32} color="var(--secondary-text)" style={{ margin: '0 auto' }} />
            </div>
            <h3>Drop files here or choose below</h3>
            
            <div className="upload-buttons">
                <button 
                    className="btn-secondary" 
                    onClick={() => fileInputRef.current.click()}
                >
                    <Upload size={18} /> Upload Images
                </button>
                <button 
                    className="btn-secondary" 
                    onClick={() => cameraInputRef.current.click()}
                >
                    <Camera size={18} /> Camera
                </button>
            </div>

            <p className="upload-hint">Supports: JPG, PNG, WEBP, PDF</p>

            {/* Hidden Inputs */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden-input" 
                accept="image/*,application/pdf" 
                multiple 
                onChange={handleFileSelect} 
            />
            <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden-input" 
                accept="image/*" 
                capture="environment" 
                multiple
                onChange={handleFileSelect} 
            />
        </div>
    );
}
