import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Sparkles, Scale } from 'lucide-react';
import UploadZone from './components/UploadZone';
import ThumbnailGrid from './components/ThumbnailGrid';
import OutputBox from './components/OutputBox';
import ErrorMessage from './components/ErrorMessage';
import LandingPage from './components/LandingPage';
import { useTranscribe } from './hooks/useTranscribe';

const LOADING_STEPS = [
    { icon: '🔍', text: 'Scanning document structure…' },
    { icon: '✍️', text: 'Analysing handwriting patterns…' },
    { icon: '⚖️', text: 'Applying legal document rules…' },
    { icon: '✂️', text: 'Removing crossed-out text…' },
    { icon: '📌', text: 'Processing inserted annotations…' },
    { icon: '📝', text: 'Finalising transcript…' },
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
    const progressPct = Math.min(92, (elapsed / 55) * 100); // fill to 92% over ~55s

    return (
        <div style={{ animation: 'fadeIn 0.35s ease' }}>
            {/* Step indicator row */}
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

            {/* Main card */}
            <div style={{
                background: '#fff', border: '1px solid #E5E7EB',
                borderRadius: '20px', padding: '36px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
            }}>
                {/* Animated document scan icon */}
                <div style={{
                    position: 'relative', width: '80px', height: '96px',
                    margin: '0 auto 28px', borderRadius: '8px',
                    background: 'linear-gradient(145deg, #EFF6FF, #DBEAFE)',
                    border: '2px solid #BFDBFE',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.15)'
                }}>
                    {/* Document lines */}
                    {[20, 36, 52, 66, 80].map((top) => (
                        <div key={top} style={{
                            position: 'absolute', left: '12px', right: '12px',
                            top: `${top}%`, height: '2px',
                            background: 'rgba(37,99,235,0.2)', borderRadius: '2px'
                        }} />
                    ))}
                    {/* Scanning laser line */}
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

                {/* Animated status */}
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

                {/* Progress bar */}
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

                {/* Elapsed time */}
                <p style={{ fontSize: '12px', color: '#C4C4C4', margin: 0 }}>
                    {elapsed < 5 ? 'Starting…' : `${elapsed}s elapsed · Usually completes in under a minute`}
                </p>
            </div>

            {/* What we're doing */}
            <div style={{
                marginTop: '14px', background: '#F8FAFC',
                border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 18px'
            }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: '1.7' }}>
                    <strong style={{ color: '#374151' }}>What Inkto is doing:</strong> reading every word of your handwriting, silently discarding crossed-out text, and inserting any caret-marked additions into the correct positions — all before returning the clean result.
                </p>
            </div>
        </div>
    );
}

function App() {
    const { state, files, error, transcribedText, sessionId, addFiles, removeFile, transcribe, fetchSession, reset } = useTranscribe();
    const [customPrompt, setCustomPrompt] = useState('');
    const [promptFocused, setPromptFocused] = useState(false);
    const [showLanding, setShowLanding] = useState(!localStorage.getItem('inkto_launched') && !window.location.pathname.startsWith('/session/'));

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/session/')) {
            const id = path.split('/')[2];
            if (id) {
                fetchSession(id);
            }
        }
    }, []);

    const handleGetStarted = () => {
        localStorage.setItem('inkto_launched', '1');
        setShowLanding(false);
    };
    const handleTranscribe = () => transcribe(customPrompt);

    if (showLanding) return <LandingPage onGetStarted={handleGetStarted} />;

    return (
        <div className="app-container">
            <header>
                <div
                    onClick={() => setShowLanding(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', userSelect: 'none' }}
                    title="Back to home"
                >
                    <div style={{
                        width: '28px', height: '28px', background: '#1C1917',
                        borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Scale size={14} color="#fff" />
                    </div>
                    <span style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px', color: '#1C1917' }}>Inkto</span>
                </div>
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
            </header>

            <main>
                {/* ── Upload / Review ── */}
                {(state === 'idle' || state === 'uploading') && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <UploadZone onFilesSelected={addFiles} />

                        {state === 'uploading' && files.length > 0 && (
                            <div style={{ marginTop: '18px' }}>
                                <ThumbnailGrid files={files} onRemove={removeFile} />

                                {/* Special Instructions */}
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

                                {/* Transcribe CTA */}
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

                {/* ── Success ── */}
                {state === 'success' && <OutputBox text={transcribedText} sessionId={sessionId} onReset={reset} />}

                {/* ── Error ── */}
                {state === 'error' && (
                    <ErrorMessage message={error} onRetry={handleTranscribe} onCancel={reset} />
                )}
            </main>
        </div>
    );
}

export default App;
