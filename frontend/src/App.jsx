import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Sparkles, History as HistoryIcon, ArrowRight } from 'lucide-react';
import UploadZone from './components/UploadZone';
import ThumbnailGrid from './components/ThumbnailGrid';
import OutputBox from './components/OutputBox';
import ErrorMessage from './components/ErrorMessage';
import LandingPage from './components/LandingPage';
import History from './components/History';
import { useTranscribe } from './hooks/useTranscribe';

const LOADING_STEPS = [
    { icon: '🔍', text: 'Scanning document structure…' },
    { icon: '✍️', text: 'Analysing handwriting patterns…' },
    { icon: '⚖️', text: 'Applying legal document rules…' },
    { icon: '✂️', text: 'Removing crossed-out text…' },
    { icon: '📝', text: 'Drafting initial transcript…' },
    { icon: '🔍', text: 'Verifying numbers and proper nouns…' }, // Added for 2-pass accuracy
    { icon: '✨', text: 'Finalising transcript…' },
];

function ProcessingScreen({ pageCount }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now());

    useEffect(() => {
        const stepTimer = setInterval(() => {
            setStepIndex(i => (i + 1) % LOADING_STEPS.length);
        }, 4000);
        const elapsedTimer = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);
        return () => { clearInterval(stepTimer); clearInterval(elapsedTimer); };
    }, []);

    const step = LOADING_STEPS[stepIndex];
    // With 2-pass verification it takes a bit longer, so stretch the bar duration
    const progressPct = Math.min(95, (elapsed / 75) * 100); 

    return (
        <div style={{ animation: 'fadeIn 0.35s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#E5E7EB', color: '#9CA3AF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800'
                }}>1</div>
                <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #2563EB, #2563EB)', borderRadius: '99px' }} />
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#2563EB', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800', boxShadow: '0 0 0 4px rgba(37,99,235,0.15)'
                }}>2</div>
                <div style={{ flex: 1, height: '2px', background: '#E5E7EB', borderRadius: '99px' }} />
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#F3F4F6', color: '#D1D5DB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800'
                }}>3</div>
            </div>

            <div style={{
                background: '#fff', border: '1px solid #E5E7EB',
                borderRadius: '20px', padding: '36px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
            }}>
                <div style={{
                    position: 'relative', width: '80px', height: '96px',
                    margin: '0 auto 28px', borderRadius: '8px',
                    background: 'linear-gradient(145deg, #EFF6FF, #DBEAFE)',
                    border: '2px solid #BFDBFE',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.15)'
                }}>
                    {[20, 36, 52, 66, 80].map((top) => (
                        <div key={top} style={{
                            position: 'absolute', left: '12px', right: '12px',
                            top: `${top}%`, height: '2px',
                            background: 'rgba(37,99,235,0.2)', borderRadius: '2px'
                        }} />
                    ))}
                    <div style={{
                        position: 'absolute', left: 0, right: 0, height: '2px',
                        background: 'linear-gradient(90deg, transparent, #2563EB, transparent)',
                        animation: 'scanLine 1.8s ease-in-out infinite',
                        boxShadow: '0 0 8px rgba(37,99,235,0.6)'
                    }} />
                </div>

                <h3 style={{
                    fontSize: '19px', fontWeight: '800', color: '#111827',
                    marginBottom: '6px', letterSpacing: '-0.3px'
                }}>
                    Reading {pageCount} {pageCount === 1 ? 'page' : 'pages'}…
                </h3>

                <div style={{
                    minHeight: '48px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px', marginBottom: '24px'
                }}>
                    <span style={{ fontSize: '16px', animation: 'fadeIn 0.4s ease' }} key={stepIndex + 'icon'}>
                        {step.icon}
                    </span>
                    <p style={{
                        color: '#6B7280', fontSize: '14px', fontWeight: '500',
                        margin: 0, animation: 'fadeIn 0.4s ease'
                    }} key={stepIndex + 'text'}>
                        {step.text}
                    </p>
                </div>

                <div style={{
                    height: '5px', background: '#F3F4F6',
                    borderRadius: '99px', overflow: 'hidden',
                    maxWidth: '220px', margin: '0 auto 14px'
                }}>
                    <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
                        borderRadius: '99px',
                        width: `${progressPct}%`,
                        transition: 'width 1s linear'
                    }} />
                </div>

                <p style={{ fontSize: '12px', color: '#C4C4C4', margin: 0 }}>
                    {elapsed < 5 ? 'Starting…' : `${elapsed}s elapsed · Usually completes in ~60-90s`}
                </p>
            </div>

            <div style={{
                marginTop: '14px', background: '#F8FAFC',
                border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 18px'
            }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: '1.7' }}>
                    <strong style={{ color: '#374151' }}>Accuracy Verification:</strong> After the initial transcription, a second AI pass strictly verifies all numbers, dates, and proper nouns against the original image to guarantee legal-grade accuracy.
                </p>
            </div>
        </div>
    );
}

function App() {
    const { state, files, error, transcribedText, sessionId, sessionImages, addFiles, removeFile, transcribe, fetchSession, reset } = useTranscribe();
    const [customPrompt, setCustomPrompt] = useState('');
    const [promptFocused, setPromptFocused] = useState(false);
    const isHistoryPath = window.location.pathname === '/history';
    const isSessionPath = window.location.pathname.startsWith('/session/');
    const [showLanding, setShowLanding] = useState(!localStorage.getItem('inkto_launched') && !isSessionPath && !isHistoryPath);
    const [showHistory, setShowHistory] = useState(isHistoryPath);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/session/')) {
            const id = path.split('/')[2];
            if (id) fetchSession(id);
        } else if (path === '/history') {
            setShowHistory(true);
        }

        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/history') setShowHistory(true);
            else if (path === '/') { setShowHistory(false); reset(); }
            else if (path.startsWith('/session/')) {
                setShowHistory(false);
                fetchSession(path.split('/')[2]);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleGetStarted = () => {
        localStorage.setItem('inkto_launched', '1');
        setShowLanding(false);
        window.history.pushState({}, '', '/');
    };
    
    const handleTranscribe = () => transcribe(customPrompt);

    const navigateToHistory = () => {
        setShowLanding(false);
        reset();
        setShowHistory(true);
        window.history.pushState({}, '', '/history');
    };

    const handleSessionSelect = (id) => {
        setShowHistory(false);
        window.history.pushState({}, '', `/session/${id}`);
        fetchSession(id);
    };

    if (showLanding) return <LandingPage onGetStarted={handleGetStarted} />;

    return (
        <div className={state === 'success' ? 'app-container-desktop' : 'app-container'}>
            <header>
                <div
                    onClick={() => { setShowHistory(false); reset(); window.history.pushState({}, '', '/'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', userSelect: 'none' }}
                    title="Back to home"
                >
                    <span style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px', color: '#1C1917' }}>Inkto</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={navigateToHistory}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', color: '#78716C', background: 'transparent',
                            padding: '7px 12px', borderRadius: '8px', border: 'none',
                            fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s, background 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F5F4F0'; e.currentTarget.style.color = '#1C1917'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; }}
                    >
                        <HistoryIcon size={13} /> History
                    </button>
                    <a
                        href="https://wa.me/2349130436032"
                        target="_blank" rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', color: '#78716C', textDecoration: 'none',
                            padding: '7px 14px', borderRadius: '8px',
                            border: '1px solid #E4E2DC', background: '#fff',
                            fontWeight: '600', transition: 'border-color 0.2s, color 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#A8A29E'; e.currentTarget.style.color = '#1C1917'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E2DC'; e.currentTarget.style.color = '#78716C'; }}
                    >
                        <HelpCircle size={13} /> Help
                    </a>
                </div>
            </header>

            <main>
                {showHistory ? (
                    <History 
                        onBack={() => { setShowHistory(false); window.history.pushState({}, '', '/'); }} 
                        onSelectSession={handleSessionSelect} 
                    />
                ) : (
                    <>
                        {/* ── Upload / Review ── */}
                        {(state === 'idle' || state === 'uploading') && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <UploadZone onFilesSelected={addFiles} />

                                {state === 'uploading' && files.length > 0 && (
                                    <div style={{ marginTop: '18px' }}>
                                        <ThumbnailGrid files={files} onRemove={removeFile} />

                                        <div style={{ marginTop: '16px' }}>
                                            <div style={{
                                                background: '#fff',
                                                border: `1.5px solid ${promptFocused ? '#A8A29E' : '#D6D3CE'}`,
                                                borderRadius: '12px', padding: '14px 16px',
                                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                                boxShadow: promptFocused ? '0 0 0 3px rgba(168,162,158,0.1)' : 'none'
                                            }}>
                                                <label style={{
                                                    display: 'block', fontSize: '11px', fontWeight: '700',
                                                    letterSpacing: '0.06em', color: promptFocused ? '#57534E' : '#A8A29E',
                                                    textTransform: 'uppercase', marginBottom: '8px',
                                                    transition: 'color 0.2s'
                                                }}>
                                                    Special Instructions (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder='e.g. "This is a Lagos State affidavit — note 2 exhibits at the back"'
                                                    value={customPrompt}
                                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                                    onFocus={() => setPromptFocused(true)}
                                                    onBlur={() => setPromptFocused(false)}
                                                    style={{
                                                        width: '100%', border: 'none', outline: 'none',
                                                        fontSize: '14px', color: '#1F2937',
                                                        fontFamily: 'inherit', background: 'transparent',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleTranscribe}
                                            style={{
                                                marginTop: '14px', width: '100%',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', gap: '10px',
                                                padding: '17px',
                                                background: '#1C1917',
                                                color: '#fff', border: 'none', borderRadius: '14px',
                                                fontSize: '15px', fontWeight: '800',
                                                cursor: 'pointer', letterSpacing: '-0.1px',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
                                                transition: 'transform 0.15s, box-shadow 0.15s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.22)'; }}
                                        >
                                            <Sparkles size={17} />
                                            Transcribe {files.length} {files.length === 1 ? 'Page' : 'Pages'} →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Processing ── */}
                        {state === 'processing' && <ProcessingScreen pageCount={files.length} />}

                        {/* ── Sleeker Fetching Animation ── */}
                        {state === 'fetching_session' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', animation: 'fadeIn 0.4s ease' }}>
                                <div style={{
                                    display: 'flex', gap: '8px', marginBottom: '24px'
                                }}>
                                    <div className="bounce-dot" style={{ width: '10px', height: '10px', background: '#1C1917', borderRadius: '50%', animationDelay: '0s' }} />
                                    <div className="bounce-dot" style={{ width: '10px', height: '10px', background: '#1C1917', borderRadius: '50%', animationDelay: '0.15s' }} />
                                    <div className="bounce-dot" style={{ width: '10px', height: '10px', background: '#1C1917', borderRadius: '50%', animationDelay: '0.3s' }} />
                                </div>
                                <div style={{
                                    fontSize: '18px', fontWeight: '700', color: '#1C1917', letterSpacing: '-0.2px',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    Opening document <ArrowRight size={18} color="#A8A29E" className="slide-arrow" />
                                </div>
                                <p style={{ fontSize: '13px', color: '#A8A29E', marginTop: '6px' }}>Decrypting and loading securely...</p>
                                <style>{`
                                    @keyframes bounce-dot {
                                        0%, 100% { transform: translateY(0); opacity: 0.5; }
                                        50% { transform: translateY(-8px); opacity: 1; }
                                    }
                                    .bounce-dot { animation: bounce-dot 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                                    @keyframes slide-arrow {
                                        0%, 100% { transform: translateX(0); opacity: 0.5; }
                                        50% { transform: translateX(4px); opacity: 1; }
                                    }
                                    .slide-arrow { animation: slide-arrow 1.5s ease-in-out infinite; }
                                `}</style>
                            </div>
                        )}

                        {/* ── Success ── */}
                        {state === 'success' && <OutputBox text={transcribedText} sessionId={sessionId} images={sessionImages} onReset={reset} />}

                        {/* ── Error ── */}
                        {state === 'error' && (
                            <ErrorMessage message={error} onRetry={handleTranscribe} onCancel={reset} />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
