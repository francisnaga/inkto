/* eslint-disable */
// @ts-nocheck
'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { startBackgroundTranscription } from '../lib/background-transcriber';

export function useTranscribe() {
    const [state, setState] = useState('idle');
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [transcribedText, setTranscribedText] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [sessionImages, setSessionImages] = useState([]);
    const [audioUrl, setAudioUrl] = useState(null);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, active: 0, concurrency: 0 });
    const [pdfProgress, setPdfProgress] = useState(null);

    const addFiles = async (newFiles) => {
        if (!newFiles || newFiles.length === 0) return;
        const hasPdf = newFiles.some(f => f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf'));
        const processedFiles = [];
        
        const totalSize = newFiles.reduce((acc, f) => acc + f.size, 0);
        if (totalSize > 40 * 1024 * 1024 && typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
            alert('Warning: Processing extremely large files (40MB+) on a mobile phone may cause the app to run out of memory and crash. If it crashes, please use a computer for this specific file.');
        }

        if (hasPdf) setState('preparing_pdf');

        for (const f of newFiles) {
            if (f.type === 'application/pdf' || f.name?.toLowerCase().endsWith('.pdf')) {
                setPdfProgress({ current: 1, total: 1, fileName: f.name });
                try {
                    const { convertPdfToImages } = await import('../lib/pdfHelper');
                    const pages = await convertPdfToImages(f, (current, total) => {
                        setPdfProgress({ current, total, fileName: f.name });
                    });
                    processedFiles.push(...pages);
                } catch (e) {
                    console.warn('PDF client conversion error, using raw file:', e);
                    processedFiles.push(f);
                }
            } else {
                processedFiles.push(f);
            }
        }

        setPdfProgress(null);
        setFiles(prev => [...prev, ...processedFiles]);
        setState('uploading');
    };

    const removeFile = (index) => {
        setFiles(prev => {
            const next = [...prev];
            next.splice(index, 1);
            if (next.length === 0) setState('idle');
            return next;
        });
    };

    const fetchSession = useCallback(async (id) => {
        setState('fetching_session');
        setError(null);
        try {
            const response = await fetch('https://inkto.jointaccount.org/api/session?id=' + id);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load session');
            setTranscribedText(data.session.text);
            setSessionId(data.session.id);
            setSessionImages(data.session.images || []);
            setAudioUrl(data.session.audioUrl || null);
            setState('success');
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setState('error');
        }
    }, []);

    const transcribe = async (customPrompt = '') => {
        if (files.length === 0) {
            setError('Please add at least one file.');
            setState('error');
            return;
        }
        
        setState('processing');
        setError(null);
        
        try {
            await startBackgroundTranscription(files, customPrompt);
            setState('success_queued');
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setState('error');
        }
    };

    const reset = () => {
        setFiles([]);
        setTranscribedText('');
        setSessionId(null);
        setSessionImages([]);
        setAudioUrl(null);
        setError(null);
        setState('idle');
        setPdfProgress(null);
        setBatchProgress({ current: 0, total: 0, active: 0, concurrency: 0 });
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/session/')) {
            window.history.pushState({}, '', '/');
        }
    };

    return { state, files, error, transcribedText, sessionId, sessionImages, audioUrl, batchProgress, pdfProgress, addFiles, removeFile, transcribe, fetchSession, reset };
}

