# Phonetic Reverser

A web-based phonetic reversal tool that converts text or speech into phonemes and reverses them.

## Features

* Text → phoneme reversal
* Voice input
* Audio reversal
* Speech-to-text
* Responsive dark UI

## Tech Stack

* React
* TypeScript
* Vite
* Python backend

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd phonetic-reverser
```

### 2. Install dependencies

Make sure you have **Node.js 18+** installed.

```bash
npm install
```

The project uses the dependencies defined in `package.json`, so `npm install` will install everything required.

### 3. Start the development server

```bash
npm run dev
```

Vite will start the frontend and show the local URL in the terminal.

Usually:

```text
http://localhost:5173
```

Open that URL in your browser.

---

## Running the TypeScript / React Code

You **do not need to compile the `.ts` or `.tsx` files manually**.

Vite handles TypeScript and React automatically when you run:

```bash
npm run dev
```

The main entry point is:

```text
src/main.tsx
```

The application is loaded through:

```text
src/App.tsx
```

---

## Build for Production

To create a production build:

```bash
npm run build
```

The generated website will be available in:

```text
dist/
```

To preview the production build locally:

```bash
npm run preview
```

---

## Backend

The frontend communicates with the Python backend through:

```text
src/services/phoneticApi.ts
```

Set the backend URL in `.env.local`:

```env
VITE_API_URL=http://localhost:5000
```

Start the Python backend separately before using features that require the API.

---

## Project Structure

```text
src/
├── components/
│   ├── TextReverser.tsx
│   ├── VoiceReverser.tsx
│   └── VoiceExperiment.tsx
│
├── hooks/
│   └── useAudioRecorder.ts
│
├── services/
│   └── phoneticApi.ts
│
├── App.tsx
├── App.css
└── main.tsx
```

## Author

**Vijay Hiremath**
