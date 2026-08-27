/* eslint-disable */
// @ts-nocheck
'use client';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { compressImage } from '../lib/imageCompressor';

const PAGE_CONCURRENCY = 3;

export function useTranscribe() {
    const [state, setState] = useState('idle');
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [transcribedText, setTranscribedText] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [sessionImages, setSessionImages] = useState([]);
    const [audioUrl, setAudioUrl] = useState(null);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    const addFiles = async (newFiles) => {
        let processedFiles = [];
        for (const f of newFiles) {
            if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
                try {
                    const { convertPdfToImages } = await import('../lib/pdfHelper');
                    const pages = await convertPdfToImages(f);
                    processedFiles.push(...pages);
                } catch (e) {
                    console.warn('PDF client conversion error, using raw file:', e);
                    processedFiles.push(f);
                }
            } else {
                processedFiles.push(f);
            }
        }
        setFiles(prev => [...prev, ...processedFiles]);
        if (state === 'idle') setState('uploading');
    };

    const removeFile = (index) => {
        setFiles(prev => {
            const next = [...prev];
            next.splice(index, 1);
            if (next.length === 0) setState('idle');
            return next;
        });
    };

    const fetchSession = async (id) => {
        setState('fetching_session');
        setError(null);
        try {
            const response = await fetch(`/api/session?id=${id}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load session');
            setTranscribedText(data.session.text);
            setSessionId(data.session.id);
            setSessionImages(data.session.images || []);
            setAudioUrl(data.session.audioUrl || null);
            setState('success');
        } catch (err) {
            console.error(err);
            setError(err.message);
            setState('error');
        }
    };

    const transcribe = async (customPrompt = '') => {
        if (files.length === 0) {
            setError('Please add at least one file.');
            setState('error');
            return;
        }

        setState('processing');
        setError(null);

        const generatedSessionId = nanoid(21);
        const totalPages = files.length;
        const concurrency = Math.min(PAGE_CONCURRENCY, totalPages);
        setBatchProgress({ current: 0, total: totalPages, active: 0, concurrency });

        const pageBlocks = new Array(totalPages);
        const localUrls = files.map(file => URL.createObjectURL(file));

        try {
            let nextIndex = 0;
            let completed = 0;
            let active = 0;

            const transcribePage = async (index) => {
                const file = files[index];
                const pageNumber = index + 1;
                
                // Compress the image before uploading to reduce Serverless function timeout risk
                let uploadFile = file;
                const isImage = file.type?.startsWith('image/');
                if (isImage) {
                    try {
                        uploadFile = await compressImage(file);
                    } catch (e) {
                        console.warn('Compression failed, using original image:', e);
                    }
                }

                const formData = new FormData();
                formData.append('files', uploadFile);

                if (customPrompt) formData.append('prompt', customPrompt);
                formData.append('sessionId', generatedSessionId);
                formData.append('startIndex', String(index));
                formData.append('pageNumber', String(pageNumber));
                formData.append('totalPages', String(totalPages));
                formData.append('isFinalBatch', 'false');
                formData.append('totalFilesCount', String(totalPages));

                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData,
                });

                const rawText = await response.text();
                let data = {};
                try { data = JSON.parse(rawText); } catch {
                    throw new Error(`Server error (${response.status}). Please try again.`);
                }

                if (!response.ok) {
                    throw new Error(data.details || data.error || `Page ${pageNumber} failed.`);
                }

                const pageText = (data.text || '').trim();
                pageBlocks[index] = `--- Page ${pageNumber} ---\n${pageText || '[No legible text found on this page.]'}`;
            };

            const runWorker = async () => {
                while (nextIndex < totalPages) {
                    const index = nextIndex++;
                    active++;
                    setBatchProgress({ current: completed, total: totalPages, active, concurrency });

                    try {
                        await transcribePage(index);
                    } catch (err) {
                        if (!String(err.message || '').includes('auth') && !String(err.message || '').includes('configured')) {
                            try {
                                await transcribePage(index);
                            } catch (retryErr) {
                                throw new Error(`Page ${index + 1} failed: ${retryErr.message}`);
                            }
                        } else {
                            throw err;
                        }
                    } finally {
                        active--;
                    }

                    completed++;
                    setBatchProgress({ current: completed, total: totalPages, active, concurrency });
                }
            };

            await Promise.all(Array.from({ length: concurrency }, runWorker));

            const fullTranscript = pageBlocks.join('\n\n');

            const saveResponse = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'finalize',
                    sessionId: generatedSessionId,
                    text: fullTranscript,
                    totalFilesCount: totalPages
                })
            });

            if (!saveResponse.ok) {
                console.warn('Could not save session history, but transcription completed.');
            }

            setTranscribedText(fullTranscript);
            setSessionId(generatedSessionId);
            setSessionImages(localUrls);
            setState('success');
        } catch (err) {
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
        setBatchProgress({ current: 0, total: 0 });
        if (window.location.pathname.startsWith('/session/')) {
            window.history.pushState({}, '', '/');
        }
    };

    return { state, files, error, transcribedText, sessionId, sessionImages, audioUrl, batchProgress, addFiles, removeFile, transcribe, fetchSession, reset };
}
