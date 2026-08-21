import React from 'react';
import { AlertTriangle, Coffee } from 'lucide-react';

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
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', marginBottom: '16px' }}>
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
                        background: '#1C1917',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                    Try Again
                </button>
            </div>

            {/* Tip Section for Error Page */}
            <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '20px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Coffee size={16} color="#475569" />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Help us scale
                    </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 14px', lineHeight: '1.5' }}>
                    Running AI transcription models is very expensive. If Inkto is temporarily overloaded, a small tip helps us upgrade our servers and increase capacity.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <a
                        href="https://paystack.shop/pay/4h04eqpye7"
                        target="_blank" rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '8px',
                            background: '#09A5DB', color: '#fff',
                            textDecoration: 'none', fontSize: '13px', fontWeight: '600',
                            transition: 'opacity 0.2s', boxShadow: '0 2px 8px rgba(9, 165, 219, 0.2)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        Tip via Paystack
                    </a>
                    <a
                        href="https://paypal.me/frankyideal25"
                        target="_blank" rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '8px',
                            background: '#003087', color: '#fff',
                            textDecoration: 'none', fontSize: '13px', fontWeight: '600',
                            transition: 'opacity 0.2s', boxShadow: '0 2px 8px rgba(0, 48, 135, 0.2)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        Tip via PayPal
                    </a>
                </div>
            </div>
        </div>
    );
}
