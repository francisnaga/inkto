import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry, onCancel }) {
    if (!message) return null;
    
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '12px'
        }}>
            <div style={{ 
                background: '#FEF2F2', color: '#EF4444', 
                padding: '12px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <AlertTriangle size={24} />
            </div>
            <div>
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#111827', marginBottom: '4px' }}>
                    Transcription Failed
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280', maxWidth: '300px', margin: '0 auto' }}>
                    {message}
                </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                    onClick={onCancel}
                    style={{
                        padding: '10px 24px',
                        background: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6B7280',
                        cursor: 'pointer'
                    }}
                >
                    Go Back
                </button>
                <button 
                    onClick={onRetry}
                    style={{
                        padding: '10px 24px',
                        background: '#F3F4F6',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#E5E7EB'}
                    onMouseOut={(e) => e.target.style.background = '#F3F4F6'}
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
