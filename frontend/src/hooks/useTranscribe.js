import { useState } from 'react';

export function useTranscribe() {
    const [state, setState] = useState('idle'); // 'idle', 'uploading', 'processing', 'success', 'error'
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [transcribedText, setTranscribedText] = useState('');

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
        setError(null);
        setState('idle');
    };

    return {
        state,
        files,
        error,
        transcribedText,
        addFiles,
        removeFile,
        transcribe,
        reset
    };
}
