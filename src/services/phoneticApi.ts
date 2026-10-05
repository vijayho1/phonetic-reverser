/**
 * API service for the Phonetic Reverser backend.
 */

const API_BASE =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://localhost:5000' : '');

export interface ReverseResult {
  originalText: string;
  reversedPhonemes: string;
}

export interface VoiceReverseResult {
  originalText: string;
  reversedPhonemes: string;
  originalAudioUrl?: string;
  reversedAudioUrl?: string;
}

/**
 * Reverse text using the phonetic engine.
 * 
 * Backend endpoint: POST /api/reverse
 * Request: { text: string }
 * Response: { originalText: string, reversedPhonemes: string }
 */
export async function reverseText(text: string): Promise<ReverseResult> {
  const response = await fetch(`${API_BASE}/api/reverse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Backend error');
  }

  return response.json();
}

/**
 * Reverse text from voice input (speech-to-text + phonetic reversal).
 * 
 * Backend endpoint: POST /api/reverse-voice
 * Request: { text: string, audioBlob?: Blob }
 * Response: { originalText: string, reversedPhonemes: string, ... }
 */
export async function reverseVoice(
  text: string,
  audioBlob?: Blob
): Promise<VoiceReverseResult> {
  const formData = new FormData();
  formData.append('text', text);

  if (audioBlob) {
    formData.append('audio', audioBlob, 'recording.wav');
  }

  const response = await fetch(`${API_BASE}/api/reverse-voice`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Backend error');
  }

  const result = await response.json();
  const originalAudioUrl = audioBlob ? URL.createObjectURL(audioBlob) : undefined;
  let reversedAudioUrl: string | undefined;

  if (audioBlob) {
    const reversedAudio = await reverseAudio(audioBlob);
    reversedAudioUrl = URL.createObjectURL(reversedAudio);
  }

  return {
    originalText: result.originalText,
    reversedPhonemes: result.reversedPhonemes,
    originalAudioUrl,
    reversedAudioUrl,
  };
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const wavBlob = await convertBlobToWav(audioBlob);
  const formData = new FormData();
  formData.append('audio', wavBlob, 'recording.wav');

  const response = await fetch(`${API_BASE}/api/transcribe-audio`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Backend error');
  }

  const result = await response.json();
  return result.text;
}

/**
 * Reverse an audio file (for the Voice Reverser experiment).
 * 
 * Backend endpoint: POST /api/reverse-audio
 * Request: FormData with audio file
 * Response: Blob of reversed audio
 */
export async function reverseAudio(audioBlob: Blob): Promise<Blob> {
  const wavBlob = await convertBlobToWav(audioBlob);
  return reverseWavBlob(wavBlob);
}

async function convertBlobToWav(audioBlob: Blob): Promise<Blob> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

  return encodeWav(decodedBuffer);
}

async function reverseWavBlob(wavBlob: Blob): Promise<Blob> {
  const arrayBuffer = await wavBlob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

  const reversedBuffer = audioContext.createBuffer(
    decodedBuffer.numberOfChannels,
    decodedBuffer.length,
    decodedBuffer.sampleRate
  );

  for (let channel = 0; channel < decodedBuffer.numberOfChannels; channel += 1) {
    const sourceData = decodedBuffer.getChannelData(channel);
    const targetData = reversedBuffer.getChannelData(channel);

    for (let index = 0; index < sourceData.length; index += 1) {
      targetData[index] = sourceData[sourceData.length - 1 - index];
    }
  }

  return encodeWav(reversedBuffer);
}

function encodeWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerChannel = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const dataSize = samplesPerChannel * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  let offset = 0;
  writeString(offset, 'RIFF');
  offset += 4;
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString(offset, 'WAVE');
  offset += 4;
  writeString(offset, 'fmt ');
  offset += 4;
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, numberOfChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString(offset, 'data');
  offset += 4;
  view.setUint32(offset, dataSize, true);
  offset += 4;

  const channelData = Array.from({ length: numberOfChannels }, (_, channel) => audioBuffer.getChannelData(channel));

  for (let sampleIndex = 0; sampleIndex < samplesPerChannel; sampleIndex += 1) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][sampleIndex]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
