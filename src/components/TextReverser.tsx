import { useState } from 'react';
import { reverseText } from '../services/phoneticApi';
import type { ReverseResult } from '../services/phoneticApi';

export default function TextReverser() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ReverseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReverse = async () => {
    if (!input.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError(null);
    setIsWaking(false);
    const wakeTimer = setTimeout(() => setIsWaking(true), 2500);

    try {
      const response = await reverseText(input);
      setResult(response);
    } catch (err) {
      setError('Failed to reverse text. Please try again.');
      console.error(err);
    } finally {
      clearTimeout(wakeTimer);
      setIsWaking(false);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleReverse();
    }
  };

  return (
    <div className="reverser-content">
      {/* Input Section */}
      <div className="input-section">
        <textarea
          className="input-field"
          placeholder="Enter a word or sentence..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
        />
        
        <div className="input-actions">
          <button
            className="btn btn-primary"
            onClick={handleReverse}
            disabled={loading || !input.trim()}
          >
            {loading ? 'Reversing...' : 'Reverse'}
          </button>
          {input && (
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>

        {isWaking && (
          <div className="waking-tip">
            <span className="wake-spinner-sm" />
            <span>Waking up server from idle... please wait about a minute on the first request.</span>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Result Section */}
      {result && (
        <div className="result-section">
          <div className="result-block">
            <div className="result-label">Original Text</div>
            <div className="result-value">{result.originalText}</div>
          </div>

          <div className="divider" />

          <div className="result-block">
            <div className="result-label">Approximate Reversed Phonemes</div>
            <div className="result-value phonemes">{result.reversedPhonemes}</div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="empty-state">
          <p>Enter text and click Reverse to see the phoneme transformation</p>
        </div>
      )}
    </div>
  );
}
