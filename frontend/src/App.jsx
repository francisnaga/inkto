import React, { useState } from 'react';
import { HelpCircle, Loader2 } from 'lucide-react';
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

  const handleTranscribe = () => {
    transcribe(customPrompt);
  };

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
          style={{ border: 'none', background: 'transparent', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <HelpCircle size={16} /> Help
        </a>
      </header>

      <main>
        {/* State: idle | uploading */}
        {(state === 'idle' || state === 'uploading') && (
          <>
            <UploadZone onFilesSelected={addFiles} />
            
            {state === 'uploading' && (
              <>
                <ThumbnailGrid files={files} onRemove={removeFile} />
                
                <div style={{ marginTop: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--secondary-text)', display: 'block', marginBottom: '8px' }}>
                    TRANSCRIPTION PROMPT (optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. This is a legal document..." 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>

                <button 
                  className="btn-primary" 
                  onClick={handleTranscribe}
                >
                  Transcribe Document →
                </button>
              </>
            )}
          </>
        )}

        {/* State: processing */}
        {state === 'processing' && (
          <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Loader2 size={32} className="lucide-spin" style={{ margin: '0 auto 16px auto', color: 'var(--accent-color)' }} />
            <h3 style={{ marginBottom: '8px' }}>Reading your document</h3>
            <p style={{ color: 'var(--secondary-text)', fontSize: '14px' }}>This usually takes 5–15 seconds…</p>
          </div>
        )}

        {/* State: success */}
        {state === 'success' && (
          <OutputBox text={transcribedText} onReset={reset} />
        )}

        {/* State: error */}
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
