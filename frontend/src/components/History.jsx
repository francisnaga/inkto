import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, ChevronRight, Loader2, Clock, Mail, Trash2 } from 'lucide-react';

export default function History({ onBack, onSelectSession }) {
    const [history, setHistory] = useState([]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requestEmail, setRequestEmail] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);
    const [deletingIds, setDeletingIds] = useState(new Set());

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/history', { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setHistory(data.history);
                setEmail(data.email);
                setIsAuthed(true);
            } else if (res.status === 401) {
                setIsAuthed(false);
            } else {
                setError(data.error || 'Failed to load history.');
            }
        } catch {
            setError('Network error. Please try again.');
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

    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to permanently delete this document?')) return;
        
        setDeletingIds(prev => new Set(prev).add(sessionId));
        try {
            const res = await fetch('/api/delete-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ sessionId })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            setHistory(prev => prev.filter(doc => doc.id !== sessionId));
        } catch (err) {
            alert('Could not delete session: ' + err.message);
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
                <Loader2 size={22} color="#A8A29E" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#A8A29E', fontSize: '14px', margin: 0 }}>Loading...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Not authenticated — show magic link request form
    if (!isAuthed) {
        return (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <button onClick={onBack} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', color: '#78716C',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    marginBottom: '28px', padding: 0
                }}>
                    <ArrowLeft size={15} /> Back
                </button>

                <div style={{
                    maxWidth: '400px', margin: '0 auto',
                    background: '#fff', border: '1px solid #E4E2DC',
                    borderRadius: '20px', padding: '36px 32px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
                }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: '#F0F9FF', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', marginBottom: '20px'
                    }}>
                        <Mail size={20} color="#2563EB" />
                    </div>

                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1C1917', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                        View your history
                    </h2>
                    <p style={{ fontSize: '14px', color: '#78716C', marginBottom: '24px', lineHeight: '1.6' }}>
                        Enter the email you used when saving or sending a document. We'll email you a link — no password needed.
                    </p>

                    {requestSent ? (
                        <div style={{
                            background: '#F0FDF4', border: '1px solid #BBF7D0',
                            color: '#15803D', padding: '16px 18px', borderRadius: '12px',
                            fontSize: '14px', fontWeight: '500', lineHeight: '1.5'
                        }}>
                            ✓ Link sent to <strong>{requestEmail}</strong>. Check your inbox — it expires in 15 minutes.
                        </div>
                    ) : (
                        <form onSubmit={handleRequestLink} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={requestEmail}
                                onChange={e => setRequestEmail(e.target.value)}
                                required
                                style={{
                                    padding: '13px 16px', borderRadius: '10px',
                                    border: '1.5px solid #E4E2DC', fontSize: '15px',
                                    outline: 'none', width: '100%', boxSizing: 'border-box',
                                    fontFamily: 'inherit', color: '#1C1917',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#2563EB'}
                                onBlur={e => e.target.style.borderColor = '#E4E2DC'}
                            />
                            {error && <p style={{ color: '#B91C1C', fontSize: '13px', margin: 0 }}>{error}</p>}
                            <button type="submit" disabled={requesting} style={{
                                padding: '13px', background: '#1C1917', color: '#fff',
                                border: 'none', borderRadius: '10px', fontSize: '14px',
                                fontWeight: '700', cursor: requesting ? 'wait' : 'pointer',
                                opacity: requesting ? 0.6 : 1, transition: 'opacity 0.2s',
                                fontFamily: 'inherit'
                            }}>
                                {requesting ? 'Sending...' : 'Send magic link'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    // Authenticated — show document list
    return (
        <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <button onClick={onBack} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', color: '#78716C',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: 0
                }}>
                    <ArrowLeft size={15} /> Back
                </button>
                <span style={{ fontSize: '12px', color: '#A8A29E', fontWeight: '500' }}>
                    {email}
                </span>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1C1917', letterSpacing: '-0.4px', margin: '0 0 4px' }}>
                    Your documents
                </h2>
                <p style={{ fontSize: '14px', color: '#78716C', margin: 0 }}>
                    {history.length} document{history.length !== 1 ? 's' : ''} · saved indefinitely
                </p>
            </div>

            {history.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: '#FAFAF9', borderRadius: '16px',
                    border: '1px solid #E4E2DC'
                }}>
                    <FileText size={28} color="#D1CCC7" style={{ marginBottom: '12px' }} />
                    <p style={{ fontSize: '15px', color: '#A8A29E', margin: '0 0 4px', fontWeight: '600' }}>No documents yet</p>
                    <p style={{ fontSize: '13px', color: '#C4BFB9', margin: 0 }}>
                        Transcribe a document and use "Save" or "Inbox" with this email.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {history.map(doc => {
                        const date = new Date(doc.createdAt);
                        const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                        const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                        const isDeleting = deletingIds.has(doc.id);

                        return (
                            <div
                                key={doc.id}
                                onClick={() => !isDeleting && onSelectSession(doc.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '18px 20px', background: '#fff',
                                    border: '1px solid #E4E2DC', borderRadius: '14px',
                                    cursor: isDeleting ? 'wait' : 'pointer', transition: 'all 0.18s',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)', opacity: isDeleting ? 0.6 : 1
                                }}
                                onMouseEnter={e => {
                                    if (isDeleting) return;
                                    e.currentTarget.style.borderColor = '#C4BFB9';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)';
                                }}
                                onMouseLeave={e => {
                                    if (isDeleting) return;
                                    e.currentTarget.style.borderColor = '#E4E2DC';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                                }}
                            >
                                <div style={{ overflow: 'hidden', flex: 1, paddingRight: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1C1917' }}>{dateStr}</span>
                                        <span style={{ fontSize: '11px', color: '#A8A29E', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock size={10} /> {timeStr}
                                        </span>
                                        <span style={{
                                            fontSize: '11px', background: '#F5F4F0',
                                            padding: '2px 8px', borderRadius: '99px',
                                            color: '#78716C', fontWeight: '600'
                                        }}>
                                            {doc.sourceImageCount} {doc.sourceImageCount === 1 ? 'page' : 'pages'}
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '14px', color: '#57534E', margin: 0,
                                        whiteSpace: 'nowrap', overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        fontFamily: "'EB Garamond', serif",
                                        fontStyle: 'italic'
                                    }}>
                                        {doc.preview}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button 
                                        onClick={(e) => handleDeleteSession(e, doc.id)}
                                        disabled={isDeleting}
                                        title="Delete document"
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center',
                                            color: '#A8A29E', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A8A29E'; }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <ChevronRight size={17} color="#C4BFB9" style={{ flexShrink: 0 }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
