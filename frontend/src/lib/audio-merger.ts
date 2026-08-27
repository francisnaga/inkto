/**
 * Audio merger utility for combining draft recordings.
 */

export async function mergeAudioBlobs(blob1: Blob, blob2: Blob): Promise<Blob> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContextClass();
  
  const [buf1, buf2] = await Promise.all([
    blob1.arrayBuffer().then(ab => ctx.decodeAudioData(ab)),
    blob2.arrayBuffer().then(ab => ctx.decodeAudioData(ab))
  ]);
  
  const numChannels = Math.max(buf1.numberOfChannels, buf2.numberOfChannels);
  const length = buf1.length + buf2.length;
  const sampleRate = buf1.sampleRate;
  
  const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtx(numChannels, length, sampleRate);
  
  const src1 = offlineCtx.createBufferSource();
  src1.buffer = buf1;
  src1.connect(offlineCtx.destination);
  src1.start(0);
  
  const src2 = offlineCtx.createBufferSource();
  src2.buffer = buf2;
  src2.connect(offlineCtx.destination);
  src2.start(buf1.duration);
  
  const renderedBuffer = await offlineCtx.startRendering();
  return bufferToWav(renderedBuffer);
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  const sampleRate = buffer.sampleRate;
  
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // chunk length
  setUint16(1);          // sample format (raw)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * numOfChan * 2); // byte rate
  setUint16(numOfChan * 2);              // block align
  setUint16(16);                         // bits per sample
  setUint32(0x61746164);                 // "data" chunk
  setUint32(length - pos - 4);           // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length - 4) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArr], { type: 'audio/wav' });
}
