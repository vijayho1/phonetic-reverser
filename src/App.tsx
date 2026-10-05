import { useState } from 'react';
import './App.css';
import TextReverser from './components/TextReverser';
import VoiceReverser from './components/VoiceReverser';
import VoiceExperiment from './components/VoiceExperiment';
import ServerWakeBanner from './components/ServerWakeBanner';

type ActiveTab = 'text' | 'voice';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('text');

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="title">Phonetic Reverser</h1>
          <p className="subtitle">Reverse the sound structure of words and speech</p>
        </div>
      </header>

      {/* Main Reverser */}
      <main className="main-content">
        <ServerWakeBanner />

        <div className="reverser-container">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              Text
            </button>
            <button
              className={`tab ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              Voice
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'text' && <TextReverser />}
            {activeTab === 'voice' && <VoiceReverser />}
          </div>
        </div>

        {/* Voice Experiment Section */}
        <section className="experiment-section">
          <VoiceExperiment />
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-credit">Made by Vijay</p>
          <div className="footer-links">
            <a
              href="https://github.com/vijayho1"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a href="mailto:vijayhirematoi10@gmail.com">Email</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
