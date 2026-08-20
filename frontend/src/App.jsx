import React, { useState } from 'react';
import { HelpCircle, Loader2, Sparkles } from 'lucide-react';
import UploadZone from './components/UploadZone';
import ThumbnailGrid from './components/ThumbnailGrid';
import OutputBox from './components/OutputBox';
import ErrorMessage from './components/ErrorMessage';
import LandingPage from './components/LandingPage';
import { useTranscribe } from './hooks/useTranscribe';

function App() {
  const { state, files, error, transcribedText, addFiles, removeFile, transcribe, reset } = useTranscribe();
  const [customPrompt, setCustomPrompt] = useState('');
  const [showLanding, setShowLanding] = useState(!localStorage.getItem('inkto_launched'));

  const handleGetStarted = () => {
    localStorage.setItem('inkto_launched', '1');
    setShowLanding(false);
  };

  const handleTranscribe = () => transcribe(customPrompt);

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="app-container">
      <header>
        <h1>Inkto</h1>
        <a
          href="https://wa.me/2349130436032"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ border: 'none', background: 'transparent', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <HelpCircle size={15} /> Help
        </a>
      </header>

      <main>
        {/* ── Upload / File selection ── */}
        {(state === 'idle' || state === 'uploading') && (
          <>
            <UploadZone onFilesSelected={addFiles} />

            {state === 'uploading' && files.length > 0 && (
              <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s ease' }}>
                <ThumbnailGrid files={files} onRemove={removeFile} />

                {/* Optional prompt */}
                <div style={{
                  background: '#fff', border: '1px solid #E5E7EB',
                  borderRadius: '12px', padding: '16px', marginTop: '16px'
                }}>
                  <label style={{
                    fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em',
                    color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: '8px'
                  }}>
                    Special Instructions (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. This is a Nigerian court affidavit…"
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: '8px', border: '1px solid #E5E7EB',
                      fontSize: '14px', color: '#1F2937', outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>

                <button
                  className="btn-primary"
                  onClick={handleTranscribe}
                  style={{
                    marginTop: '16px', width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontSize: '15px', padding: '16px'
                  }}
                >
                  <Sparkles size={16} />
                  Transcribe {files.length > 1 ? `${files.length} Pages` : 'Document'} →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Processing ── */}
        {state === 'processing' && (
          <div style={{
            background: '#fff', border: '1px solid #E5E7EB',
            borderRadius: '20px', padding: '48px 24px',
            textAlign: 'center', animation: 'fadeIn 0.3s ease',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
          }}>
            {/* Spinner */}
            <div style={{
              width: '60px', height: '60px', margin: '0 auto 24px',
              borderRadius: '50%', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Loader2 size={28} className="lucide-spin" style={{ color: '#2563EB' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>
              Reading your document…
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', maxWidth: '260px', margin: '0 auto 24px' }}>
              Analysing handwriting, ignoring crossed-out text, and detecting insertions. This can take up to a minute.
            </p>
            {/* Progress bar */}
            <div style={{
              height: '4px', background: '#F3F4F6', borderRadius: '99px',
              maxWidth: '200px', margin: '0 auto', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
                borderRadius: '99px', animation: 'progress 40s linear forwards'
              }} />
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {state === 'success' && (
          <OutputBox text={transcribedText} onReset={reset} />
        )}

        {/* ── Error ── */}
        {state === 'error' && (
          <ErrorMessage
            message={error}
            onRetry={handleTranscribe}
            onCancel={reset}
          />
        )}
      </main>
    </div>
  );
}

export default App;
