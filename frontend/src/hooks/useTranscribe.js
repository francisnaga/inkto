import { useState } from 'react';

export function useTranscribe() {
    const [state, setState] = useState('idle'); // 'idle', 'uploading', 'processing', 'success', 'error'
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [transcribedText, setTranscribedText] = useState('');
    const [sessionId, setSessionId] = useState(null);

    const addFiles = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (state === 'idle') setState('uploading');
    };

    const removeFile = (index) => {
        setFiles(prev => {
            const newFiles = [...prev];
            newFiles.splice(index, 1);
            if (newFiles.length === 0) setState('idle');
            return newFiles;
        });
    };

    const fetchSession = async (id) => {
        setState('fetching_session');
        setError(null);
        try {
            const response = await fetch(`/api/session?id=${id}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load session');
            }

            setTranscribedText(data.session.text);
            setSessionId(data.session.id);
            setState('success');
        } catch (err) {
            console.error(err);
            setError(err.message);
            setState('error');
        }
    };

    const transcribe = async (customPrompt = '') => {
        if (files.length === 0) {
            setError("Please add at least one file");
            setState('error');
            return;
        }

        setState('processing');
        setError(null);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        
        if (customPrompt) {
            formData.append('prompt', customPrompt);
        }

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            // Parse safely - avoids Safari DOMException if server returns HTML
            const rawText = await response.text();
            let data = {};
            try {
                data = JSON.parse(rawText);
            } catch {
                throw new Error(`Server error (${response.status}). Please try again.`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Transcription failed. Please try again.');
            }

            setTranscribedText(data.text);
            if (data.sessionId) setSessionId(data.sessionId);
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
        setError(null);
        setState('idle');
        // If we were on a session URL, remove it
        if (window.location.pathname.startsWith('/session/')) {
            window.history.pushState({}, '', '/');
        }
    };

    return {
        state,
        files,
        error,
        transcribedText,
        sessionId,
        addFiles,
        removeFile,
        transcribe,
        fetchSession,
        reset
    };
}
