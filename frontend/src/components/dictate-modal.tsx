'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Square, RefreshCw, Loader2, CloudLightning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveOfflineRecording } from '@/lib/indexeddb';
import { nanoid } from 'nanoid';

interface DictateModalProps {
  onClose: () => void;
  onTranscribeComplete: (text: string, sessionId: string) => void;
}

type RecordStatus = 'idle' | 'recording' | 'paused' | 'offline_queued' | 'transcribing' | 'error';

export default function DictateModal({ onClose, onTranscribeComplete }: DictateModalProps) {
  const [status, setStatus] = useState<RecordStatus>('idle');
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const stopRecording = () => {
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
    const online = await checkConnectivity();

    if (!online) {
      // Offline fallback: save to IndexedDB queue
      const id = nanoid(21);
      const title = `Voice Dictation (${new Date().toLocaleDateString('en-GB')})`;
      try {
        await saveOfflineRecording(id, blob, title);
        setStatus('offline_queued');
        // Let the user's main list sync on reconnection
        try {
          // Trigger a dummy post to cloud to register the metadata as pending
          // (if possible, otherwise let it sync fully when reconnect triggers)
        } catch {}
      } catch (dbErr) {
        setErrorMessage('Offline save failed.');
        setStatus('error');
      }
      return;
    }

    // Online path: send to transcribe API
    const formData = new FormData();
    formData.append('files', blob, 'dictation.wav');

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ASR Transcription failed');
      onTranscribeComplete(data.text, data.sessionId);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'ASR transcription failed.');
      setStatus('error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', color: '#1C1917', borderRadius: 24, width: '100%', maxWidth: 400, padding: '32px 24px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: '#F5F4F0', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#78716C' }}>
          <X size={16} />
        </button>

        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>Voice Dictation</h3>
        <p style={{ fontSize: 13, color: '#78716C', textAlign: 'center', margin: '0 0 32px 0', lineHeight: 1.5 }}>
          Record your dictation or proceedings. Gemini will convert it directly to structured text.
        </p>

        {/* Waveform & Timer Section */}
        <div style={{ height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 40, width: '100%' }}>
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
          <span style={{ fontSize: 44, fontWeight: 800, color: '#1C1917', fontVariantNumeric: 'tabular-nums' }}>
            {formatTimer(timer)}
          </span>
          {status === 'recording' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }} className="animate-pulse">
              ● Recording
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

          {status === 'recording' && (
            <Button onClick={stopRecording} variant="destructive" size="lg" className="w-full h-14 rounded-xl gap-2 font-semibold">
              <Square size={18} /> Stop & Transcribe
            </Button>
          )}

          {status === 'transcribing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Loader2 size={32} className="animate-spin text-primary" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#78716C' }}>Gemini is transcribing…</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, margin: 0 }}>{errorMessage || 'An error occurred.'}</p>
              <Button onClick={startRecording} size="sm" className="gap-1.5"><RefreshCw size={14} /> Retry</Button>
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
