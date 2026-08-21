import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, ChevronRight, Loader2 } from 'lucide-react';

export default function History({ onBack, onSelectSession }) {
    const [history, setHistory] = useState([]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requestEmail, setRequestEmail] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (res.ok && data.success) {
                setHistory(data.history);
                setEmail(data.email);
            } else if (res.status === 401) {
                // Not authenticated
                setEmail('');
            } else {
                throw new Error(data.error || 'Failed to load history');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestLink = async (e) => {
        e.preventDefault();
        if (!requestEmail) return;
        setRequesting(true);
        setError(null);
        try {
            const res = await fetch('/api/request-history-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: requestEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send link');
            setRequestSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <Loader2 className="spinner" size={24} color="#78716C" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!email) {
        return (
            <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
                <button onClick={onBack} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', color: '#78716C',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    marginBottom: '24px', padding: 0
                }}>
                    <ArrowLeft size={16} /> Back
                </button>

                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1C1917', marginBottom: '8px' }}>
                    Document History
                </h2>
                <p style={{ fontSize: '15px', color: '#57534E', marginBottom: '24px', lineHeight: '1.5' }}>
                    Enter your email to receive a secure login link.
                </p>

                {requestSent ? (
                    <div style={{ background: '#DCFCE7', color: '#15803D', padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: '500' }}>
                        Check your inbox! We've sent a magic link to {requestEmail}.
                    </div>
                ) : (
                    <form onSubmit={handleRequestLink} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={requestEmail}
                            onChange={e => setRequestEmail(e.target.value)}
                            required
                            style={{
                                padding: '14px 16px', borderRadius: '10px',
                                border: '1px solid #E4E2DC', fontSize: '15px',
                                outline: 'none', width: '100%', boxSizing: 'border-box'
                            }}
                        />
                        {error && <p style={{ color: '#B91C1C', fontSize: '13px', margin: 0 }}>{error}</p>}
                        <button type="submit" disabled={requesting} style={{
                            padding: '14px', background: '#1C1917', color: '#fff',
                            border: 'none', borderRadius: '10px', fontSize: '15px',
                            fontWeight: '700', cursor: requesting ? 'wait' : 'pointer',
                            opacity: requesting ? 0.7 : 1
                        }}>
                            {requesting ? 'Sending...' : 'Send Magic Link'}
                        </button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <button onClick={onBack} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', color: '#78716C',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0
                }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ fontSize: '13px', color: '#78716C', fontWeight: '500' }}>
                    Logged in as <b>{email}</b>
                </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1C1917', marginBottom: '24px' }}>
                Your Documents
            </h2>

            {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FAFAF9', borderRadius: '16px', border: '1px solid #E4E2DC' }}>
                    <FileText size={32} color="#A8A29E" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '15px', color: '#78716C', margin: 0 }}>No documents found for this email.</p>
                </div>
            ) : (
                <div className="history-list">
                    {history.map(doc => (
                        <div 
                            key={doc.id} 
                            onClick={() => onSelectSession(doc.id)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px', background: '#fff', border: '1px solid #E4E2DC',
                                borderRadius: '12px', marginBottom: '12px', cursor: 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#A8A29E'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E2DC'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ overflow: 'hidden', paddingRight: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1C1917' }}>
                                        {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span style={{ fontSize: '11px', background: '#F5F4F0', padding: '2px 8px', borderRadius: '99px', color: '#78716C', fontWeight: '600' }}>
                                        {doc.sourceImageCount} pages
                                    </span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#57534E', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'EB Garamond', serif" }}>
                                    {doc.preview}
                                </p>
                            </div>
                            <ChevronRight size={18} color="#A8A29E" style={{ flexShrink: 0 }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
