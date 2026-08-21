import React, { useState } from 'react';

export default function StarRating({ sessionId, onRated }) {
    const [hovered, setHovered] = useState(0);
    const [selected, setSelected] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleRate = async (stars) => {
        if (submitted || submitting) return;
        setSelected(stars);
        setSubmitting(true);
        try {
            await fetch('/api/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, stars })
            });
            setSubmitted(true);
            if (onRated) onRated(stars);
        } catch {
            // silent fail — don't block the user
        } finally {
            setSubmitting(false);
        }
    };

    const active = hovered || selected;

    if (submitted) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px',
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: '10px',
                fontSize: '13px', fontWeight: '600', color: '#15803D'
            }}>
                <span style={{ fontSize: '16px' }}>{'★'.repeat(selected)}</span>
                Thanks for rating!
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px',
            background: '#FAFAF9', border: '1px solid #E4E2DC',
            borderRadius: '10px'
        }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#78716C', whiteSpace: 'nowrap' }}>
                Rate this transcript
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => handleRate(n)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '2px', fontSize: '22px', lineHeight: 1,
                            color: n <= active ? '#F59E0B' : '#D1D5DB',
                            transform: n <= active ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.1s ease',
                            filter: n <= active ? 'drop-shadow(0 0 3px rgba(245,158,11,0.4))' : 'none'
                        }}
                        aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
}
