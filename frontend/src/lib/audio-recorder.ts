export const AudioRecorder = {
  async start() {
      // Fallback for web is handled directly in dictate-modal
  },

  async stop(): Promise<{ blob: Blob, mimeType: string }> {
    return { blob: new Blob(), mimeType: 'audio/webm' };
  }
};
