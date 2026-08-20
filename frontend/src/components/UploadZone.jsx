import React, { useRef, useState } from 'react';
import { Camera, Upload, FileText, ImageIcon, X, AlertCircle } from 'lucide-react';
import { convertPdfToImages } from '../utils/pdfHelper';
import { compressImage } from '../utils/imageCompressor';

export default function UploadZone({ onFilesSelected }) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMsg, setProcessingMsg] = useState('');
    const [rejectedFiles, setRejectedFiles] = useState([]);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'application/pdf'];

    const processFiles = async (fileList) => {
        setIsProcessing(true);
        setRejectedFiles([]);
        const finalFiles = [];
        const rejected = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            setProcessingMsg(`Preparing file ${i + 1} of ${fileList.length}…`);
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i);

            if (!isPdf && !isImage) {
                rejected.push(file.name);
                continue;
            }

            try {
                if (isPdf) {
                    setProcessingMsg(`Converting PDF: ${file.name}…`);
                    const images = await convertPdfToImages(file);
                    for (const img of images) {
                        const compressed = await compressImage(img).catch(() => img);
                        finalFiles.push(compressed);
                    }
                } else {
                    const compressed = await compressImage(file).catch(() => file);
                    finalFiles.push(compressed);
                }
            } catch (err) {
                console.error('Failed to process', file.name, err);
                finalFiles.push(file);
            }
        }

        if (rejected.length > 0) setRejectedFiles(rejected);
        if (finalFiles.length > 0) onFilesSelected(finalFiles);
        setIsProcessing(false);
        setProcessingMsg('');
    };

    const handleDragOver = (e) => { e.preventDefault(); if (!isProcessing) setIsDragActive(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragActive(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files?.length > 0) processFiles(Array.from(e.dataTransfer.files));
    };
    const handleFileSelect = (e) => {
        if (e.target.files?.length > 0) processFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    return (
        <div style={{ animation: 'fadeIn 0.35s ease' }}>
            {/* Step label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#2563EB', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800', flexShrink: 0
                }}>1</div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', letterSpacing: '0.01em' }}>
                    Upload your document
                </span>
                <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#F3F4F6', color: '#D1D5DB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800'
                }}>2</div>
                <div style={{ width: '20px', height: '1px', background: '#E5E7EB' }} />
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#F3F4F6', color: '#D1D5DB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800'
                }}>3</div>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragActive ? '#2563EB' : '#D1D5DB'}`,
                    borderRadius: '16px',
                    background: isDragActive ? 'rgba(37,99,235,0.04)' : '#FAFAFA',
                    padding: '32px 20px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                    transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
                }}
            >
                {isProcessing ? (
                    <div>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            border: '3px solid #E5E7EB', borderTopColor: '#2563EB',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500', margin: 0 }}>
                            {processingMsg}
                        </p>
                    </div>
                ) : (
                    <>
                        <div style={{
                            width: '56px', height: '56px', margin: '0 auto 16px',
                            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                            borderRadius: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FileText size={26} color="#2563EB" />
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
                            {isDragActive ? 'Drop files here' : 'Drop files or choose below'}
                        </p>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>
                            JPG · PNG · WEBP · PDF — up to 25 MB each
                        </p>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => cameraInputRef.current.click()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '13px 22px',
                                    background: '#1A1A1A', color: '#fff',
                                    border: 'none', borderRadius: '12px',
                                    fontSize: '14px', fontWeight: '700',
                                    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                                    minWidth: '140px', justifyContent: 'center'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.24)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)'; }}
                            >
                                <Camera size={18} /> Take Photo
                            </button>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '13px 22px',
                                    background: '#fff', color: '#1A1A1A',
                                    border: '2px solid #E5E7EB', borderRadius: '12px',
                                    fontSize: '14px', fontWeight: '700',
                                    cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s',
                                    minWidth: '140px', justifyContent: 'center'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#1A1A1A'; }}
                            >
                                <Upload size={18} /> Upload Files
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Rejected files warning */}
            {rejectedFiles.length > 0 && (
                <div style={{
                    marginTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px',
                    background: '#FFF7ED', border: '1px solid #FED7AA',
                    borderRadius: '10px', padding: '12px 14px'
                }}>
                    <AlertCircle size={16} color="#EA580C" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div>
                        <span style={{ fontSize: '13px', color: '#C2410C', fontWeight: '600' }}>Unsupported files skipped: </span>
                        <span style={{ fontSize: '13px', color: '#9A3412' }}>{rejectedFiles.join(', ')}</span>
                    </div>
                </div>
            )}

            {/* Hidden inputs */}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }}
                accept="image/*,application/pdf" multiple onChange={handleFileSelect} />
            <input type="file" ref={cameraInputRef} style={{ display: 'none' }}
                accept="image/*" capture="environment" multiple onChange={handleFileSelect} />
        </div>
    );
}
