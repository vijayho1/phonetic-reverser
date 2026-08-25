# Phonetic Reverser - Run Instructions

## 1) Open a terminal in the project folder

```powershell
cd "C:\Users\Vijay\Desktop\phonetic_reverser\phonetic-reverser"
```

## 2) Start the Python backend

```powershell
"C:\Users\Vijay\Desktop\phonetic_reverser\.venv\Scripts\python.exe" app.py
```

This runs the Flask API on:

- http://localhost:5000

## 3) Install frontend dependencies (if needed)

```powershell
npm install
```

## 4) Start the web app

```powershell
npm run dev -- --host 0.0.0.0
```

This runs the Vite app on:

- http://localhost:5173

## 5) Open the app in the browser

```text
http://localhost:5173/
```

## 6) If the backend has dependency issues

Run these commands:

```powershell
"C:\Users\Vijay\Desktop\phonetic_reverser\.venv\Scripts\python.exe" -m pip install --upgrade --force-reinstall numpy
"C:\Users\Vijay\Desktop\phonetic_reverser\.venv\Scripts\python.exe" -m pip install --force-reinstall regex
```

Then restart the backend.

## 7) If you want to reinstall all Python requirements

```powershell
"C:\Users\Vijay\Desktop\phonetic_reverser\.venv\Scripts\python.exe" -m pip install -r requirements.txt
```

## Notes

- The backend handles text and audio processing.
- The frontend is the React/Vite interface.
- Stop either server with Ctrl+C in its terminal.
