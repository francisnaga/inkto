import re

with open('src/components/dictate-modal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace startRecording
start_pattern = r"  const startRecording = async \(\) => \{.*?\n  \};\n"
new_start = """  const startRecording = async () => {
    setErrorMessage(null);
    setTimer(0);
    saveActionRef.current = 'transcribe';
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        await AudioRecorder.start();
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorder.onstop = async () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await handleAudioStopped(audioBlob, ext);
        };
        mediaRecorder.start();
      }
      setStatus('recording');
    } catch (err: any) {
      console.error('Mic access error:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError' || err?.message?.includes('denied')
          ? 'Microphone access was denied. Please check your permissions.'
          : 'Could not access microphone.'
      );
      setStatus('error');
    }
  };
"""
text = re.sub(start_pattern, new_start, text, flags=re.DOTALL)

# Replace pauseRecording
pause_pattern = r"  const pauseRecording = \(\) => \{.*?\n  \};\n"
new_pause = """  const pauseRecording = async () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      import('capacitor-voice-recorder').then(({ VoiceRecorder }) => VoiceRecorder.pauseRecording());
      setStatus('paused');
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        setStatus('paused');
      }
    }
  };
"""
text = re.sub(pause_pattern, new_pause, text, flags=re.DOTALL)

# Replace resumeRecording
resume_pattern = r"  const resumeRecording = \(\) => \{.*?\n  \};\n"
new_resume = """  const resumeRecording = async () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      import('capacitor-voice-recorder').then(({ VoiceRecorder }) => VoiceRecorder.resumeRecording());
      setStatus('recording');
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        setStatus('recording');
      }
    }
  };
"""
text = re.sub(resume_pattern, new_resume, text, flags=re.DOTALL)

# Replace triggerStopWithAction
stop_pattern = r"  const triggerStopWithAction = \(action: 'transcribe' \| 'save_raw_audio'\) => \{.*?\n    \}\n  \};\n"
new_stop = """  const triggerStopWithAction = async (action: 'transcribe' | 'save_raw_audio') => {
    saveActionRef.current = action;
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      try {
        const { blob, mimeType } = await AudioRecorder.stop();
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('aac') ? 'aac' : 'webm';
        await handleAudioStopped(blob, ext);
      } catch (e) {
        console.error('Stop error', e);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };
"""
text = re.sub(stop_pattern, new_stop, text, flags=re.DOTALL)

with open('src/components/dictate-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
