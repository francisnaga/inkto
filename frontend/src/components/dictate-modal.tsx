'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { X, Mic, Square, Pause, Play, Save, RefreshCw, Loader2, CloudLightning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveOfflineRecording } from '@/lib/indexeddb';
import { nanoid } from 'nanoid';

interface DictateModalProps {
  onClose: () => void;
  onTranscribeComplete: (text: string, sessionId: string) => void;
  draftId?: string;
  initialAudioUrl?: string;
}

type RecordStatus = 'idle' | 'recording' | 'paused' | 'offline_queued' | 'transcribing' | 'error';

export default function DictateModal({ onClose, onTranscribeComplete, draftId, initialAudioUrl }: DictateModalProps) {
  const [status, setStatus] = useState<RecordStatus>('idle');
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [initialBlob, setInitialBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const saveActionRef = useRef<'transcribe' | 'save_raw_audio' | 'save_draft'>('transcribe');

  // Stop everything safely
  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const setOn = () => setIsOnline(true);
    const setOff = () => setIsOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  useEffect(() => {
    if (initialAudioUrl) {
      fetch(initialAudioUrl)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load draft');
          return res.blob();
        })
        .then(blob => {
          setInitialBlob(blob);
        })
        .catch(err => {
          console.error('[Dictate] Failed to pre-load draft audio:', err);
        });
    }
  }, [initialAudioUrl]);

  // Timer logic
  useEffect(() => {
    if (status === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setTimer(0);
    saveActionRef.current = 'transcribe';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleAudioStopped(audioBlob);
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (err: any) {
      console.error('Mic access error:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please check your browser permission settings.'
          : 'Could not access microphone.'
      );
      setStatus('error');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
    }
  };

  const triggerStopWithAction = (action: 'transcribe' | 'save_raw_audio' | 'save_draft') => {
    saveActionRef.current = action;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const checkConnectivity = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
      const ping = await fetch('/api/user-status', { method: 'HEAD' });
      return ping.ok;
    } catch {
      return false;
    }
  };

  const handleAudioStopped = async (blob: Blob) => {
    setStatus('transcribing');
    setProgressStep(1);

    // Auto-advance progress UI to show user what is happening under the hood
    const t1 = setTimeout(() => setProgressStep(2), 800);
    const t2 = setTimeout(() => setProgressStep(3), 2000);
    const t3 = setTimeout(() => setProgressStep(4), 3800);

    let finalBlob = blob;
    if (initialBlob) {
      try {
        const { mergeAudioBlobs } = await import('@/lib/audio-merger');
        finalBlob = await mergeAudioBlobs(initialBlob, blob);
      } catch (err) {
        console.error('Audio merge failed client-side:', err);
      }
    }

    const online = await checkConnectivity();

    if (!online) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      // Offline fallback: save to IndexedDB queue
      const id = draftId || nanoid(21);
      const title = `Voice Dictation (${new Date().toLocaleDateString('en-GB')})`;
      try {
        await saveOfflineRecording(id, finalBlob, title);
        setStatus('offline_queued');
      } catch (dbErr) {
        setErrorMessage('Offline save failed.');
        setStatus('error');
      }
      return;
    }

    // Online path: send to transcribe API
    const formData = new FormData();
    formData.append('files', finalBlob, 'dictation.wav');
    
    if (saveActionRef.current === 'save_draft') {
      formData.append('action', 'save_raw_audio');
      formData.append('isDraft', 'true');
    } else {
      formData.append('action', saveActionRef.current);
    }
    
    const sessionId = draftId || nanoid(21);
    formData.append('sessionId', sessionId);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ASR Transcription failed');

      // Clear layout timeouts
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setProgressStep(4);
      
      // Let user see 100% checkmark briefly for premium feedback
      await new Promise(r => setTimeout(r, 600));

      if (saveActionRef.current === 'save_raw_audio') {
        window.location.href = '/history';
      } else if (saveActionRef.current === 'save_draft') {
        onClose();
      } else {
        onTranscribeComplete(data.text, data.sessionId);
      }
    } catch (err: any) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      console.error(err);
      setErrorMessage(err.message || 'ASR transcription failed.');
      setStatus('error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', color: '#1C1917', borderRadius: 24, width: '100%', maxWidth: 400, padding: '32px 24px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        
        {/* Close Button */}
        {status !== 'transcribing' && (
          <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: '#F5F4F0', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#78716C' }}>
            <X size={16} />
          </button>
        )}

        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>Voice Dictation</h3>
        <p style={{ fontSize: 13, color: '#78716C', textAlign: 'center', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Record meetings, notes, or court proceedings. Pause, save, or transcribe with Gemini.
        </p>

        {!isOnline && (
          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: '10px 14px', width: '100%', marginBottom: 18, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600, textAlign: 'center' }}>⚠ No connection — recording saved locally</span>
          </div>
        )}

        {/* Waveform & Timer Section */}
        <div style={{ height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 24, width: '100%' }}>
          {status === 'recording' && (
            <div className="flex items-center gap-1.5 h-10 mb-4">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="bg-primary rounded-full w-1.5"
                  style={{
                    height: '100%',
                    animation: 'wave 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
          )}
          {status === 'paused' && (
            <div className="flex items-center gap-1 h-10 mb-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-muted rounded-full w-1.5 h-2" />
              ))}
            </div>
          )}
          <span style={{ fontSize: 44, fontWeight: 800, color: '#1C1917', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {formatTimer(timer)}
          </span>
          {status === 'recording' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }} className="animate-pulse">
              ● Recording
            </span>
          )}
          {status === 'paused' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>
              Recording Paused
            </span>
          )}
        </div>

        {/* Action Controller */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {status === 'idle' && (
            <Button onClick={startRecording} size="lg" className="w-full h-14 rounded-xl gap-2 font-semibold">
              <Mic size={18} /> Start Recording
            </Button>
          )}

          {(status === 'recording' || status === 'paused') && (
            <div className="w-full space-y-3">
              <div className="flex gap-3">
                {status === 'recording' ? (
                  <Button onClick={pauseRecording} variant="outline" className="flex-1 h-12 rounded-xl gap-2 font-semibold border-2">
                    <Pause size={16} /> Pause
                  </Button>
                ) : (
                  <Button onClick={resumeRecording} className="flex-1 h-12 rounded-xl gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Play size={16} /> Resume
                  </Button>
                )}
                
                <Button onClick={() => triggerStopWithAction('transcribe')} variant="default" className="flex-1 h-12 rounded-xl gap-2 font-semibold">
                  <Square size={16} /> {isOnline ? 'Stop & Transcribe' : 'Stop & Save Offline'}
                </Button>
              </div>

              <Button onClick={() => triggerStopWithAction('save_draft')} variant="secondary" className="w-full h-12 rounded-xl gap-2 font-semibold border">
                <Save size={16} /> Save & Continue Later
              </Button>
            </div>
          )}

          {status === 'transcribing' && (
            <div className="w-full space-y-4 py-2 bg-stone-50 rounded-2xl p-4 border text-left">
              <p className="font-bold text-sm text-foreground text-center mb-3">
                {saveActionRef.current === 'save_draft'
                  ? 'Saving voice draft…'
                  : saveActionRef.current === 'save_raw_audio'
                    ? 'Saving voice recording…'
                    : 'Transcribing voice…'}
              </p>
              
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-center gap-3 text-sm">
                  {progressStep > 1 ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  )}
                  <span className={progressStep >= 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                    Packaging and optimizing audio file
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3 text-sm">
                  {progressStep > 2 ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                  ) : progressStep === 2 ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-muted shrink-0" />
                  )}
                  <span className={progressStep >= 2 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                    Uploading to cloud storage
                  </span>
                </div>

                {/* Step 3 */}
                {saveActionRef.current === 'transcribe' ? (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      {progressStep > 3 ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                      ) : progressStep === 3 ? (
                        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-muted shrink-0" />
                      )}
                      <span className={progressStep >= 3 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                        Analyzing speech accent & dialect
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      {progressStep === 4 ? (
                        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-muted shrink-0" />
                      )}
                      <span className={progressStep >= 4 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                        Generating legal transcription
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-sm">
                    {progressStep >= 3 ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    )}
                    <span className={progressStep >= 3 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                      Saving to document history
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'offline_queued' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <CloudLightning size={32} className="text-amber-500" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1C1917' }}>Queued offline</span>
              <p style={{ fontSize: 12, color: '#78716C', margin: 0 }}>
                You are offline. The audio was saved locally and will transcribe automatically once you are reconnected.
              </p>
              <Button onClick={onClose} size="sm" className="mt-2 w-full">Got it</Button>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', width: '100%' }}>
              <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, margin: 0 }}>{errorMessage || 'An error occurred.'}</p>
              {errorMessage?.toLowerCase().includes('sign in') ? (
                <Link href="/login" className="w-full">
                  <Button size="sm" className="w-full">Sign In</Button>
                </Link>
              ) : (
                <Button onClick={startRecording} size="sm" className="gap-1.5"><RefreshCw size={14} /> Retry</Button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1.0); }
        }
      `}</style>
    </div>
  );
}
