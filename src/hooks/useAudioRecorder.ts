import { useState, useRef, useCallback } from 'react';

export interface RecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    audioBlob: null,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<number | undefined>(undefined);
  const stopRecordingResolverRef = useRef<((audioBlob: Blob | null) => void) | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      chunksRef.current = [];
      let recordedTime = 0;

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstart = () => {
        setState(prev => ({
          ...prev,
          isRecording: true,
          duration: 0,
        }));

        durationIntervalRef.current = window.setInterval(() => {
          recordedTime += 100;
          setState(prev => ({
            ...prev,
            duration: recordedTime / 1000,
          }));
        }, 100);
      };

      mediaRecorder.onstop = () => {
        clearInterval(durationIntervalRef.current);
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setState(prev => ({
          ...prev,
          isRecording: false,
          audioBlob,
        }));

        stopRecordingResolverRef.current?.(audioBlob);
        stopRecordingResolverRef.current = null;

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      return new Promise<Blob | null>((resolve) => {
        stopRecordingResolverRef.current = resolve;
        mediaRecorderRef.current?.stop();
      });
    }

    return Promise.resolve(null);
  }, [state.isRecording]);

  const clearRecording = useCallback(() => {
    setState({
      isRecording: false,
      audioBlob: null,
      duration: 0,
    });
    chunksRef.current = [];
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
