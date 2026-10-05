import { useEffect, useState } from 'react';
import { checkServerHealth } from '../services/phoneticApi';

export default function ServerWakeBanner() {
  const [status, setStatus] = useState<'idle' | 'waking' | 'ready' | 'hidden'>('idle');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Show warning only if health check takes > 1.5 seconds
    const delayTimer = setTimeout(() => {
      setStatus('waking');
      intervalId = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }, 1500);

    const ping = async () => {
      const isHealthy = await checkServerHealth(controller.signal);
      clearTimeout(delayTimer);
      if (intervalId) clearInterval(intervalId);

      if (isHealthy) {
        setStatus((current) => {
          if (current === 'waking') {
            // It was waking up, let the user know it is ready now!
            setTimeout(() => setStatus('hidden'), 3500);
            return 'ready';
          }
          // Server was already awake, keep it hidden
          return 'hidden';
        });
      }
    };

    ping();

    return () => {
      controller.abort();
      clearTimeout(delayTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (status === 'idle' || status === 'hidden') {
    return null;
  }

  return (
    <div className={`wake-banner wake-banner-${status}`}>
      <div className="wake-banner-content">
        <div className="wake-banner-icon">
          {status === 'waking' ? (
            <span className="wake-spinner" />
          ) : (
            <span className="wake-check">✓</span>
          )}
        </div>
        <div className="wake-banner-text">
          {status === 'waking' ? (
            <>
              <strong>Waking up backend server...</strong>
              <span>
                Free tier hosts spin down when idle. Starting up can take ~30–60 seconds ({seconds}s elapsed).
                Thanks for your patience!
              </span>
            </>
          ) : (
            <>
              <strong>Server is awake and ready!</strong>
              <span>You can now reverse text and audio instantly.</span>
            </>
          )}
        </div>
        <button
          className="wake-banner-close"
          onClick={() => setStatus('hidden')}
          aria-label="Dismiss banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
