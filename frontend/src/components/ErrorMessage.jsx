import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
    if (!message) return null;
    
    return (
        <div className="error-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '8px' }}>
                <AlertTriangle size={18} /> Something went wrong
            </div>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>{message}</p>
            <button 
                className="btn-secondary" 
                onClick={onRetry}
                style={{ borderColor: '#FCA5A5', color: 'var(--error-color)' }}
            >
                ← Try Again
            </button>
        </div>
    );
}
