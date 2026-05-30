FROM python:3.11-slim-bookworm

# FFmpeg (video frames), Tesseract (OCR) for production-grade moderation
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PYTHONUNBUFFERED=1
ENV AI_DEVICE=cpu
ENV MODEL_BUNDLE_VERSION=1.1.0
ENV DEV_AUTH_BYPASS=true
ENV DEV_STATIC_TOKEN=dev-moderation-token

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/api/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]
