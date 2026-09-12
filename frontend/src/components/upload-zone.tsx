/* eslint-disable */
// @ts-nocheck
'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, FileText, AlertCircle } from 'lucide-react';
import { convertPdfToImages } from '@/lib/pdfHelper';
import { ScannerContainer } from '@/components/scanner/ScannerContainer';

export default function UploadZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMsg, setProcessingMsg] = useState('');
    const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const processFiles = async (fileList: File[]) => {
        setIsProcessing(true);
        setRejectedFiles([]);
        const finalFiles: File[] = [];
        const rejected: string[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            setProcessingMsg(`Preparing ${i + 1} of ${fileList.length}…`);
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i);
            if (!isPdf && !isImage) { rejected.push(file.name); continue; }
            try {
                if (isPdf) {
                    setProcessingMsg(`Reading PDF…`);
                    const images = await convertPdfToImages(file, (current: number, total: number) => {
                        setProcessingMsg(`Converting PDF: page ${current} of ${total}…`);
                    });
                    for (const img of images) finalFiles.push(img as any);
                } else {
                    finalFiles.push(file as any);
                }
            } catch (err) {
                console.error("File processing error:", err);
                if (isPdf) {
                    rejected.push(`${file.name} (PDF processing failed)`);
                } else {
                    finalFiles.push(file);
                }
            }
        }

        if (rejected.length > 0) setRejectedFiles(rejected);
        if (finalFiles.length > 0) onFilesSelected(finalFiles);
        setIsProcessing(false);
        setProcessingMsg('');
    };

    const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); if (!isProcessing) setIsDragActive(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false); };
    const handleDrop      = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(false); if (e.dataTransfer.files?.length) processFiles(Array.from(e.dataTransfer.files)); };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) processFiles(Array.from(e.target.files)); e.target.value = ''; };

    if (showScanner) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#000' }}>
                <ScannerContainer 
                    onScanComplete={(pages) => { setShowScanner(false); onFilesSelected(pages); }}
                    onConvertToText={(pages) => { setShowScanner(false); onFilesSelected(pages); }}
                    onClose={() => setShowScanner(false)} 
                />
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.35s ease' }}>

            {/* Step Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    background: '#1D4ED8', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800
                }}>1</div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#44403C', letterSpacing: '0.01em' }}>
                    Upload your document
                </span>
                <div style={{ flex: 1, height: '1px', background: '#E4E2DC' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[2, 3].map(n => (
                        <div key={n} style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: '#EDECE8', color: '#C4C0BB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 800
                        }}>{n}</div>
                    ))}
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                style={{
                    border: `2px dashed ${isDragActive ? '#1D4ED8' : '#D6D3CE'}`,
                    borderRadius: '16px',
                    background: isDragActive ? 'rgba(29,78,216,0.04)' : '#FAFAF9',
                    padding: '40px 24px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: isProcessing ? 'default' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {isProcessing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>Processing document</span>
                            <span style={{ fontSize: '13px', color: '#6B7280' }}>{processingMsg}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            width: '56px', height: '56px', background: '#F3F4F6',
                            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', color: '#6B7280'
                        }}>
                            <FileText size={28} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 10px', letterSpacing: '-0.3px' }}>
                            Choose a file or drag & drop it here
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px', lineHeight: 1.5, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                            Supports <strong style={{ color: '#4B5563' }}>JPEG, PNG, and PDF</strong> files up to 25MB.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                disabled={isProcessing}
                                onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '9px',
                                    padding: '12px 24px',
                                    background: '#1D4ED8', color: '#fff',
                                    border: 'none', borderRadius: '10px',
                                    fontSize: '14px', fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
                                    minWidth: '148px', justifyContent: 'center'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.22)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.16)'; }}
                            >
                                <Camera size={17} /> Take Photo
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '9px',
                                    padding: '12px 24px',
                                    background: '#fff', color: '#1C1917',
                                    border: '1.5px solid #D6D3CE', borderRadius: '10px',
                                    fontSize: '14px', fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s, border-color 0.15s, color 0.15s',
                                    minWidth: '148px', justifyContent: 'center'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#1D4ED8'; e.currentTarget.style.color = '#1D4ED8'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#D6D3CE'; e.currentTarget.style.color = '#1C1917'; }}
                            >
                                <Upload size={17} /> Browse Files
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Rejected files */}
            {rejectedFiles.length > 0 && (
                <div style={{
                    marginTop: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px',
                    background: '#FFF7ED', border: '1px solid #FED7AA',
                    borderRadius: '10px', padding: '12px 14px'
                }}>
                    <AlertCircle size={15} color="#EA580C" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div>
                        <span style={{ fontSize: '13px', color: '#C2410C', fontWeight: 700 }}>Skipped: </span>
                        <span style={{ fontSize: '13px', color: '#9A3412' }}>{rejectedFiles.join(', ')}</span>
                    </div>
                </div>
            )}

            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,application/pdf" multiple onChange={handleFileSelect} />
            <input type="file" ref={cameraInputRef} style={{ display: 'none' }} accept="image/*" capture="environment" multiple onChange={handleFileSelect} />
        </div>
    );
}

