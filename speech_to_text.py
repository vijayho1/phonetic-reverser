import sounddevice as sd
from scipy.io.wavfile import write
import speech_recognition as sr
import numpy as np

# Recording settings
duration = 5
sample_rate = 44100

print("Speak now...")

audio_data = sd.rec(
    int(duration * sample_rate),
    samplerate=sample_rate,
    channels=1,
    dtype=np.int16
)

sd.wait()

write("recording.wav", sample_rate, audio_data)

print("Recording finished!")
print("Recognizing...")


# Speech recognition
recognizer = sr.Recognizer()

with sr.AudioFile("recording.wav") as source:
    audio = recognizer.record(source)

try:
    text = recognizer.recognize_google(audio)
    print("You said:", text)

except sr.UnknownValueError:
    print("I couldn't understand what you said.")

except sr.RequestError:
    print("Could not connect to the speech recognition service.")