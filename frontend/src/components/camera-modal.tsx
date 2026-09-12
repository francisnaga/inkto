'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera as CameraIcon, Zap, ZapOff, SwitchCamera } from 'lucide-react';
import { compressImage } from '@/lib/imageCompressor';

interface CameraModalProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState('');
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [hasFlash, setHasFlash] = useState(false);
    const [flashOn, setFlashOn] = useState(false);

    const startCamera = useCallback(async () => {
        setIsReady(false);
        setError('');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: facingMode },
                    width: { ideal: 3840 }, // Try to get 4K or highest available
                    height: { ideal: 2160 },
                    focusMode: { ideal: "continuous" }
                } as any,
                audio: false
            });
            
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsReady(true);
                };
            }

            const track = stream.getVideoTracks()[0];
            const caps = track.getCapabilities?.() as any;
            if (caps && caps.torch) {
                setHasFlash(true);
            }
        } catch (err) {
            console.error("Camera start error:", err);
            setError("Could not access camera. Please allow permissions.");
        }
    }, [facingMode]);

    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [startCamera]);

    const toggleFlash = async () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        try {
            await track.applyConstraints({
                advanced: [{ torch: !flashOn } as any]
            });
            setFlashOn(!flashOn);
        } catch (e) {
            console.warn("Flash not supported", e);
        }
    };

    const takePhoto = async () => {
        if (!videoRef.current || !streamRef.current) return;
        
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            // Compress immediately to save memory in the main app
            const compressed = await compressImage(file);
            
            // Turn off camera
            streamRef.current?.getTracks().forEach(t => t.stop());
            onCapture(compressed as File);
        }, 'image/jpeg', 0.95);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#000', zIndex: 99999,
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Top Bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', zIndex: 10
            }}>
                <button onClick={onClose} style={{
                    background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                    width: '44px', height: '44px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <X size={24} />
                </button>

                {hasFlash && (
                    <button onClick={toggleFlash} style={{
                        background: flashOn ? '#F59E0B' : 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                        width: '44px', height: '44px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {flashOn ? <Zap size={20} /> : <ZapOff size={20} />}
                    </button>
                )}
            </div>

            {/* Viewfinder */}
            <div style={{ flex: 1, position: 'relative', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {error ? (
                    <p style={{ color: '#fff', textAlign: 'center', padding: '0 20px' }}>{error}</p>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            opacity: isReady ? 1 : 0, transition: 'opacity 0.3s'
                        }}
                    />
                )}
            </div>

            {/* Bottom Controls */}
            <div style={{
                background: '#000', padding: '30px 20px 40px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-around'
            }}>
                <div style={{ width: '44px' }} /> {/* Spacer */}
                
                <button
                    onClick={takePhoto}
                    disabled={!isReady}
                    style={{
                        width: '76px', height: '76px', borderRadius: '50%',
                        border: '4px solid #fff', background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', outline: 'none'
                    }}
                >
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: '#fff'
                    }} />
                </button>

                <button
                    onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                    style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                        width: '44px', height: '44px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <SwitchCamera size={22} />
                </button>
            </div>
        </div>
    );
}
