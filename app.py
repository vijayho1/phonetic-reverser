from io import BytesIO
from collections import defaultdict, deque
import os
import tempfile
from time import time
import wave

import cmudict
from flask import Flask, jsonify, request, Response, send_from_directory
from flask_cors import CORS
import speech_recognition as sr

from phonetic_engine import process_sentence_stream, process_word


DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
app = Flask(__name__, static_folder=DIST_DIR if os.path.exists(DIST_DIR) else None)

cors_origins_raw = os.environ.get('CORS_ORIGINS', '*').strip()
if cors_origins_raw == '*':
    CORS(app, resources={r"/api/*": {"origins": "*"}})
else:
    allowed_origins = [orig.strip() for orig in cors_origins_raw.split(',') if orig.strip()]
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_UPLOAD_BYTES', '5242880'))

dictionary = cmudict.dict()
recognizer = sr.Recognizer()
rate_limits = defaultdict(deque)


def _rate_limit(bucket: str, limit: int = 30, window_seconds: int = 60) -> tuple[dict, int] | None:
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown')
    key = f'{bucket}:{client_ip}'
    now = time()
    hits = rate_limits[key]

    while hits and now - hits[0] > window_seconds:
        hits.popleft()

    if len(hits) >= limit:
        return {'error': 'Too many requests. Please try again later.'}, 429

    hits.append(now)
    return None


def _reverse_audio_bytes(audio_bytes: bytes, filename: str | None, mimetype: str | None) -> tuple[bytes, str]:
    is_wav = False
    if filename and filename.lower().endswith('.wav'):
        is_wav = True
    if mimetype and 'wav' in mimetype.lower():
        is_wav = True

    if not is_wav:
        return audio_bytes, mimetype or 'application/octet-stream'

    try:
        with wave.open(BytesIO(audio_bytes), 'rb') as source:
            params = source.getparams()
            frames = source.readframes(source.getnframes())
    except (wave.Error, EOFError):
        return audio_bytes, mimetype or 'application/octet-stream'

    frame_width = params.sampwidth * params.nchannels
    reversed_frames = b''.join(
        frames[index:index + frame_width]
        for index in range(len(frames) - frame_width, -1, -frame_width)
    )

    output = BytesIO()
    with wave.open(output, 'wb') as target:
        target.setparams(params)
        target.writeframes(reversed_frames)

    return output.getvalue(), 'audio/wav'


def _reverse_text(text: str) -> tuple[dict, int]:
    cleaned_text = text.strip()
    if not cleaned_text:
        return {'error': 'No text provided'}, 400

    if len(cleaned_text.split()) == 1:
        result = process_word(cleaned_text, dictionary)
        if result is None:
            return {'error': 'Could not process word'}, 400
    else:
        result = process_sentence_stream(cleaned_text, dictionary)
        if result is None:
            return {'error': 'Could not process sentence'}, 400

    return result, 200


def _transcribe_audio_bytes(audio_bytes: bytes, filename: str | None, mimetype: str | None) -> tuple[dict, int]:
    is_wav = False
    if filename and filename.lower().endswith('.wav'):
        is_wav = True
    if mimetype and 'wav' in mimetype.lower():
        is_wav = True

    if not is_wav:
        return {'error': 'Audio must be converted to WAV before transcription'}, 400

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        with sr.AudioFile(temp_path) as source:
            audio = recognizer.record(source)

        transcript = recognizer.recognize_google(audio)
        return {'text': transcript.strip()}, 200
    except sr.UnknownValueError:
        return {'error': 'Could not understand the audio'}, 400
    except sr.RequestError as error:
        return {'error': f'Speech recognition service error: {error}'}, 502
    except Exception:
        return {'error': 'Failed to transcribe audio'}, 500
    finally:
        try:
            if 'temp_path' in locals() and temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
        except OSError:
            pass


@app.get('/health')
def health():
    return jsonify({'status': 'ok'})


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if os.path.exists(DIST_DIR):
        file_path = os.path.join(DIST_DIR, path)
        if path and os.path.exists(file_path):
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, 'index.html')
    return jsonify({'status': 'ok', 'message': 'API backend is running. Frontend dist not found.'})


@app.post('/api/reverse')
def reverse_text():
    limited = _rate_limit('reverse-text')
    if limited:
        return jsonify(limited[0]), limited[1]

    payload = request.get_json(silent=True) or {}
    text = payload.get('text', '')

    result, status_code = _reverse_text(text)
    if status_code != 200:
        return jsonify(result), status_code

    return jsonify(
        {
            'originalText': text.strip(),
            'reversedPhonemes': result['pronunciation'],
        }
    )


@app.post('/api/reverse-voice')
def reverse_voice():
    limited = _rate_limit('reverse-voice')
    if limited:
        return jsonify(limited[0]), limited[1]

    text = (request.form.get('text') or '').strip()
    if not text:
        payload = request.get_json(silent=True) or {}
        text = str(payload.get('text', '')).strip()

    result, status_code = _reverse_text(text)
    if status_code != 200:
        return jsonify(result), status_code

    return jsonify(
        {
            'originalText': text,
            'reversedPhonemes': result['pronunciation'],
        }
    )


@app.post('/api/transcribe-audio')
def transcribe_audio():
    limited = _rate_limit('transcribe-audio', limit=10)
    if limited:
        return jsonify(limited[0]), limited[1]

    audio = request.files.get('audio')
    if not audio:
        return jsonify({'error': 'No audio provided'}), 400

    audio_bytes = audio.read()
    result, status_code = _transcribe_audio_bytes(audio_bytes, audio.filename, audio.mimetype)

    if status_code != 200:
        return jsonify(result), status_code

    return jsonify(result)


@app.post('/api/reverse-audio')
def reverse_audio():
    limited = _rate_limit('reverse-audio', limit=10)
    if limited:
        return jsonify(limited[0]), limited[1]

    audio = request.files.get('audio')
    if not audio:
        return jsonify({'error': 'No audio provided'}), 400

    audio_bytes = audio.read()
    reversed_bytes, mimetype = _reverse_audio_bytes(audio_bytes, audio.filename, audio.mimetype)

    return Response(
        reversed_bytes,
        status=200,
        mimetype=mimetype,
        headers={
            'Content-Disposition': 'inline; filename="reversed-audio.wav"',
        },
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5000'))
    debug_mode = os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')
    app.run(host='0.0.0.0', debug=debug_mode, port=port)
