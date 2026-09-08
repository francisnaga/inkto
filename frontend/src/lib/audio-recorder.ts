import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';

export const AudioRecorder = {
  async start() {
    if (Capacitor.isNativePlatform()) {
      const canRecord = await VoiceRecorder.canDeviceVoiceRecord();
      if (!canRecord.value) throw new Error('Device cannot record audio');
      
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission.value) {
        const req = await VoiceRecorder.requestAudioRecordingPermission();
        if (!req.value) throw new Error('Microphone permission denied');
      }
      
      await VoiceRecorder.startRecording();
    } else {
      // Fallback for web is handled directly in dictate-modal
    }
  },

  async stop(): Promise<{ blob: Blob, mimeType: string }> {
    if (Capacitor.isNativePlatform()) {
      const result = await VoiceRecorder.stopRecording();
      const base64Sound = result.value.recordDataBase64;
      const mimeType = result.value.mimeType;
      
      const res = await fetch(`data:${mimeType};base64,${base64Sound}`);
      const blob = await res.blob();
      return { blob, mimeType };
    }
    return { blob: new Blob(), mimeType: 'audio/webm' };
  }
};
