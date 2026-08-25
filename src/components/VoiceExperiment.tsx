import { useState } from 'react';
import { reverseAudio } from '../services/phoneticApi';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export default function VoiceExperiment() {
  const recorder = useAudioRecorder();
  const [reversedAudioUrl, setReversedAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartExperiment = async () => {
    setReversedAudioUrl(null);
    setError(null);
    await recorder.startRecording();
  };

  const handleStopExperiment = () => {
    recorder.stopRecording();
  };

  const handleReverseAudio = async () => {
    if (!recorder.audioBlob) return;

    setLoading(true);
    setError(null);

    try {
      const reversed = await reverseAudio(recorder.audioBlob);
      const url = URL.createObjectURL(reversed);
      setReversedAudioUrl(url);
    } catch (err) {
      setError('Failed to reverse audio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!reversedAudioUrl) return;

    const a = document.createElement('a');
    a.href = reversedAudioUrl;
    a.download = 'reversed-audio.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    recorder.clearRecording();
    setReversedAudioUrl(null);
    setError(null);
  };

  return (
    <div className="experiment-card">
      <div className="experiment-header">
        <h2>Try Your Voice</h2>
        <p>Record something and hear it played backwards</p>
      </div>

      <div className="experiment-content">
        {/* Recording Phase */}
        {!recorder.audioBlob && (
          <div className="experiment-controls">
            <button
              className={`btn-mic ${recorder.isRecording ? 'recording' : ''}`}
              onClick={recorder.isRecording ? handleStopExperiment : handleStartExperiment}
            >
              <span className="mic-icon">🎤</span>
              <span className="mic-text">
                {recorder.isRecording ? 'Stop' : 'Record'}
              </span>
            </button>

            {recorder.isRecording && (
              <div className="recording-time">
                {Math.floor(recorder.duration)}s
              </div>
            )}
          </div>
        )}

        {/* Playback Phase */}
        {recorder.audioBlob && !reversedAudioUrl && (
          <div className="playback-section">
            <div className="audio-group">
              <div className="audio-label">Original Recording</div>
              <audio
                src={URL.createObjectURL(recorder.audioBlob)}
                controls
                className="audio-player"
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleReverseAudio}
              disabled={loading}
            >
              {loading ? 'Reversing...' : 'Reverse Audio'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Start Over
            </button>
          </div>
        )}

        {/* Reversed Audio Phase */}
        {reversedAudioUrl && (
          <div className="playback-section">
            <div className="audio-group">
              <div className="audio-label">Original Recording</div>
              <audio
                src={URL.createObjectURL(recorder.audioBlob!)}
                controls
                className="audio-player"
              />
            </div>

            <div className="audio-group">
              <div className="audio-label">Reversed Recording</div>
              <audio
                src={reversedAudioUrl}
                controls
                className="audio-player"
              />
            </div>

            <div className="experiment-actions">
              <button
                className="btn btn-primary"
                onClick={handleDownload}
              >
                Download Reversed Audio
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleReset}
              >
                Try Another
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}
