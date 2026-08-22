import { useState } from 'react';
import { nanoid } from 'nanoid';

export function useTranscribe() {
    const [state, setState] = useState('idle');
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [transcribedText, setTranscribedText] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [sessionImages, setSessionImages] = useState([]);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    const addFiles = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
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
        // Vercel serverless functions have a hard 60s ceiling. Keep each AI call
        // mapped to exactly one page so long PDFs/images cannot time out as a batch
        // or let the model merge/repeat pages inside one response.
        const BATCH_SIZE = 1;
        const totalBatches = Math.ceil(files.length / BATCH_SIZE);
        setBatchProgress({ current: 1, total: totalBatches });

        let fullTranscript = '';
        const localUrls = files.map(file => URL.createObjectURL(file));

        try {
            for (let i = 0; i < totalBatches; i++) {
                setBatchProgress({ current: i + 1, total: totalBatches });

                const batchFiles = files.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
                const formData = new FormData();
                batchFiles.forEach(file => formData.append('files', file));
                const pageNumber = i + 1;

                if (customPrompt) formData.append('prompt', customPrompt);
                formData.append('sessionId', generatedSessionId);
                formData.append('startIndex', String(i * BATCH_SIZE));
                formData.append('pageNumber', String(pageNumber));
                formData.append('totalPages', String(files.length));
                formData.append('isFinalBatch', String(i === totalBatches - 1));
                formData.append('totalFilesCount', String(files.length));
                // Pass all previously collected text so the final batch can save a complete record
                if (i === totalBatches - 1) {
                    formData.append('fullTranscript', fullTranscript);
                }

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
                    throw new Error(data.error || 'Transcription failed. Please try again.');
                }

                const pageText = (data.text || '').trim();
                const pageBlock = `--- Page ${pageNumber} ---\n${pageText || '[No legible text found on this page.]'}`;
                fullTranscript += (fullTranscript ? '\n\n' : '') + pageBlock;
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
        setError(null);
        setState('idle');
        setBatchProgress({ current: 0, total: 0 });
        if (window.location.pathname.startsWith('/session/')) {
            window.history.pushState({}, '', '/');
        }
    };

    return { state, files, error, transcribedText, sessionId, sessionImages, batchProgress, addFiles, removeFile, transcribe, fetchSession, reset };
}
