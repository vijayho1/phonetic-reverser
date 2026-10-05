# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Stage 2: Python Backend with Gunicorn
FROM python:3.11-slim
WORKDIR /app

# System dependencies for audio handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    flac \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download NLTK and g2p_en models during build time
RUN python -c "from g2p_en import G2p; G2p()"

# Copy built frontend assets to dist/
COPY --from=frontend-builder /app/dist ./dist

# Copy application source
COPY . .

ENV PORT=7860
EXPOSE 7860

# Start production WSGI server (adapts to $PORT if provided by host, otherwise 7860)
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-7860} --workers 2 --timeout 120 app:app"]
