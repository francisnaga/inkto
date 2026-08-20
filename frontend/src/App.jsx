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

  // Landing page — skip if already authenticated
  const [showLanding, setShowLanding] = useState(!localStorage.getItem('handscript_password'));
  
  // Authentication state
  const [password, setPassword] = useState(localStorage.getItem('handscript_password') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('handscript_password'));
  const [loginInput, setLoginInput] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginInput.trim()) {
      localStorage.setItem('handscript_password', loginInput);
      setPassword(loginInput);
      setIsAuthenticated(true);
    }
  };

  const handleTranscribe = () => {
    transcribe(customPrompt, password);
  };

  // If unauthorized error, reset auth state
  if (state === 'error' && error === 'UNAUTHORIZED' && isAuthenticated) {
    setIsAuthenticated(false);
    setPassword('');
  }

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className="app-container">
      <header>
        <h1>Scriva</h1>
        <button className="btn-secondary" style={{ border: 'none', background: 'transparent' }}>
          <HelpCircle size={16} /> Help
        </button>
      </header>

      <main>
        {!isAuthenticated ? (
          <div style={{ maxWidth: '400px', margin: '60px auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '16px' }}>Welcome back</h2>
            <form onSubmit={handleLogin}>
              <input 
                type="password" 
                placeholder="Enter password" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px', marginBottom: '16px' }}
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ marginTop: '0' }}>Login</button>
            </form>
            {state === 'error' && error === 'UNAUTHORIZED' && (
              <ErrorMessage message="Invalid password" onRetry={() => {}} />
            )}
          </div>
        ) : (
          <>
            {/* State: idle | uploading */}
            {(state === 'idle' || state === 'uploading') && (
              <>
                <UploadZone onFilesSelected={addFiles} />
                
                {state === 'uploading' && (
                  <>
                    <ThumbnailGrid files={files} onRemove={removeFile} />
                    
                    <div style={{ marginTop: '24px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--secondary-text)', display: 'block', marginBottom: '8px' }}>
                        TRANSCRIPTION PROMPT (optional — advanced)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Transcribe this handwritten document..." 
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
                <h3 style={{ marginBottom: '8px' }}>Reading your handwritten document</h3>
                <p style={{ color: 'var(--secondary-text)', fontSize: '14px' }}>This usually takes 5–15 seconds</p>
              </div>
            )}

            {/* State: success */}
            {state === 'success' && (
              <OutputBox text={transcribedText} onReset={reset} />
            )}

            {/* State: error */}
            {state === 'error' && error !== 'UNAUTHORIZED' && (
              <ErrorMessage 
                message={error} 
                onRetry={handleTranscribe} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
