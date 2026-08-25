# Phonetic Reverser Frontend — Setup & Integration Guide

## Quick Start

```bash
cd phonetic-reverser
npm install
npm run dev
```

The app will run at `http://localhost:5173` (or whatever port Vite assigns).

---

## Project Structure

```
src/
├── components/
│   ├── TextReverser.tsx       # Text input & phoneme reversal
│   ├── VoiceReverser.tsx      # Voice recording & speech-to-text
│   └── VoiceExperiment.tsx    # Pure audio reversal experiment
├── hooks/
│   └── useAudioRecorder.ts    # Audio recording logic
├── services/
│   └── phoneticApi.ts         # Backend abstraction layer ← INTEGRATE HERE
├── App.tsx                    # Main app shell
├── App.css                    # All styling (dark theme + responsive)
└── main.tsx                   # Entry point
```

---

## Backend Integration

**All backend communication lives in `src/services/phoneticApi.ts`.**

This file is designed to be swapped out with real API calls to your Python backend.

### Step 1: Update API Base URL

In `phoneticApi.ts`, uncomment the real implementation and set your backend URL:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### Step 2: Replace Mock Functions

Three functions need real implementation:

#### `reverseText(text: string)`

```typescript
export async function reverseText(text: string): Promise<ReverseResult> {
  const response = await fetch(`${API_BASE}/api/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) throw new Error('Backend error');
  return response.json();
}
```

**Expected response:**
```json
{
  "originalText": "hello",
  "reversedPhonemes": "OW1 L AH0 HH"
}
```

#### `reverseVoice(text: string, audioBlob?: Blob)`

```typescript
export async function reverseVoice(
  text: string,
  audioBlob?: Blob
): Promise<VoiceReverseResult> {
  const formData = new FormData();
  formData.append('text', text);
  if (audioBlob) formData.append('audio', audioBlob, 'recording.wav');

  const response = await fetch(`${API_BASE}/api/reverse-voice`, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}
```

**Expected response:**
```json
{
  "originalText": "hello",
  "reversedPhonemes": "OW1 L AH0 HH",
  "reversedAudioUrl": "..."
}
```

The React service can also create local blob URLs for playback after the backend returns the reversed audio bytes.

#### `reverseAudio(audioBlob: Blob)`

```typescript
export async function reverseAudio(audioBlob: Blob): Promise<Blob> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  const response = await fetch(`${API_BASE}/api/reverse-audio`, {
    method: 'POST',
    body: formData,
  });
  
  return response.blob();
}
```

**Returns:** Binary audio blob (reversed audio file)

---

## Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:5000
```

Or if deployed:

```
VITE_API_URL=https://your-backend-domain.com
```

---

## Backend Contract

Your Python backend should expose these endpoints:

### POST `/api/reverse`
- **Request:** `{ "text": "hello" }`
- **Response:** `{ "originalText": "hello", "reversedPhonemes": "OW1 L AH0 HH" }`

### POST `/api/reverse-voice`
- **Request:** FormData with `text` and optionally `audio`
- **Response:** `{ "originalText": "hello", "reversedPhonemes": "...", "reversedAudioUrl": "..." }`

### POST `/api/reverse-audio`
- **Request:** FormData with `audio` (binary)
- **Response:** Binary audio blob (reversed audio)

### CORS

If frontend and backend are on different domains, enable CORS in your Python backend:

```python
from flask_cors import CORS

CORS(app, origins=['http://localhost:5173', 'https://yourdomain.com'])
```

Or configure it in `phoneticApi.ts` with a proxy.

---

## Development Notes

### Mocked vs Real

- **Currently:** All API calls return mock data so you can test the UI immediately
- **To use real backend:** Replace the mock functions in `phoneticApi.ts` with fetch calls

### Audio Handling

- Recordings are stored in browser memory during the session
- User can download reversed audio to their device
- No permanent server storage by design (as per spec)

### Speech-to-Text

The Voice Mode currently returns mocked recognized text. To integrate real speech-to-text:

1. Add a speech recognition service (Web Speech API, or call your backend)
2. Update `VoiceReverser.tsx` to pass real recognized text to the API

Example using Web Speech API:

```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.onresult = (e) => {
  const text = e.results[0][0].transcript;
  // Send text to backend
};
```

---

## Styling & Design

- **Theme:** Dark mode with cyan/teal accents
- **Typography:** System fonts with size scale
- **Animations:** Smooth CSS transitions (respects `prefers-reduced-motion`)
- **Responsive:** Mobile-first, works at 320px+ widths

To customize colors, edit `:root` variables in `App.css`:

```css
:root {
  --bg-dark: #0a0e27;
  --accent-cyan: #00d9ff;
  /* ... */
}
```

---

## Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

Output goes to `dist/` folder.

### Deploy to Vercel (recommended)
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag dist/ to Netlify, or use netlify-cli
```

---

## Troubleshooting

### Microphone Permission Denied
- Check browser settings → site permissions
- Test with HTTPS (microphone requires secure context)

### CORS Errors
- Make sure backend allows frontend origin in CORS headers
- Test with: `curl -H "Origin: http://localhost:5173" http://backend:5000`

### Audio Not Playing
- Check browser support for audio format (WAV recommended)
- Verify audio blob is valid (log `audioBlob.size` to check)

### Backend Not Responding
- Confirm API_BASE URL matches your backend
- Test endpoint with curl or Postman
- Check backend is running and logs show requests

---

## Next Steps

1. **Replace mocks in `phoneticApi.ts`** with real API calls to your Python backend
2. **Integrate speech-to-text** (Web Speech API or backend service)
3. **Connect audio reversal backend** if audio should be reversed server-side
4. **Test end-to-end** with real data
5. **Deploy** frontend and backend together

---

## Questions?

The code is intentionally simple and well-commented. Each component is ~100-150 lines. The `phoneticApi.ts` layer is the single point of backend integration.
