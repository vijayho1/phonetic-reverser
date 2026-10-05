import { useState } from 'react';
import { reverseVoice, transcribeAudio } from '../services/phoneticApi';
import type { VoiceReverseResult } from '../services/phoneticApi';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export default function VoiceReverser() {
  const recorder = useAudioRecorder();
  const [recognizedText, setRecognizedText] = useState('');
  const [result, setResult] = useState<VoiceReverseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'recording' | 'recognizing' | 'done'>('recording');

  const handleStart = async () => {
    setRecognizedText('');
    setResult(null);
    setError(null);
    setIsWaking(false);
    setStep('recording');

    try {
      await recorder.startRecording();
    } catch (startError) {
      setError('Unable to start recording. Please check microphone permissions.');
      console.error(startError);
    }
  };

  const handleStop = async () => {
    const audioBlob = await recorder.stopRecording();
    setStep('recognizing');
    setLoading(true);
    setIsWaking(false);
    const wakeTimer = setTimeout(() => setIsWaking(true), 2500);

    try {
      if (!audioBlob) {
        throw new Error('No recording captured.');
      }

      const text = (await transcribeAudio(audioBlob)).trim();

      if (!text) {
        throw new Error('No speech was recognized.');
      }

      setRecognizedText(text);

      // Reverse the recognized text
      const reverseResult = await reverseVoice(text, audioBlob || undefined);
      setResult(reverseResult);
      setStep('done');
    } catch (err) {
      setError('Failed to recognize speech. Please try again.');
      console.error(err);
      setStep('recording');
    } finally {
      clearTimeout(wakeTimer);
      setIsWaking(false);
      setLoading(false);
    }
  };

  const handleReset = () => {
    recorder.clearRecording();
    setRecognizedText('');
    setResult(null);
    setError(null);
    setStep('recording');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="reverser-content voice-reverser">
      {/* Recording Controls */}
      {step === 'recording' && (
        <div className="voice-controls">
          <button
            className={`btn-mic ${recorder.isRecording ? 'recording' : ''}`}
            onClick={recorder.isRecording ? handleStop : handleStart}
            disabled={loading}
          >
            <span className="mic-icon">🎤</span>
            <span className="mic-text">
              {recorder.isRecording ? 'Stop Recording' : 'Start Recording'}
            </span>
          </button>

          {recorder.isRecording && (
            <div className="recording-indicator">
              <span className="recording-dot" />
              Recording — {formatTime(recorder.duration)}
            </div>
          )}
        </div>
      )}

      {/* Processing State */}
      {step === 'recognizing' && (
        <div className="processing-state">
          <div className="spinner" />
          <p>Processing your voice...</p>
          {isWaking && (
            <div className="waking-tip" style={{ marginTop: '1rem' }}>
              <span className="wake-spinner-sm" />
              <span>Waking up server from idle... please wait about a minute on the first request.</span>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {step === 'done' && result && (
        <div className="voice-result">
          <div className="result-block">
            <div className="result-label">Original Text</div>
            <div className="result-value">{result.originalText}</div>
          </div>

          {recognizedText && recognizedText !== result.originalText && (
            <>
              <div className="divider" />
              <div className="result-block">
                <div className="result-label">Recognized Speech</div>
                <div className="result-value">{recognizedText}</div>
              </div>
            </>
          )}

          <div className="divider" />

          <div className="result-block">
            <div className="result-label">Approximate Reversed Phonemes</div>
            <div className="result-value phonemes">{result.reversedPhonemes}</div>
          </div>

          {/* Audio Controls */}
          {result.originalAudioUrl && (
            <div className="audio-controls">
              <div className="audio-item">
                <div className="audio-label">Original Recording</div>
                <audio
                  src={result.originalAudioUrl}
                  controls
                  className="audio-player"
                />
              </div>

              {result.reversedAudioUrl && (
                <div className="audio-item">
                  <div className="audio-label">Reversed Recording</div>
                  <audio
                    src={result.reversedAudioUrl}
                    controls
                    className="audio-player"
                  />
                </div>
              )}
            </div>
          )}

          <button className="btn btn-secondary" onClick={handleReset}>
            Try Again
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!result && step === 'recording' && !recorder.isRecording && (
        <div className="empty-state">
          <p>Click the microphone to start recording your voice</p>
        </div>
      )}
    </div>
  );
}
