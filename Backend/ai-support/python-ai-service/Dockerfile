FROM python:3.11-slim-bookworm

# FFmpeg optional for video moderation; install in production image if needed:
# RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libgl1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PYTHONUNBUFFERED=1
ENV AI_DEVICE=cpu
ENV MODEL_BUNDLE_VERSION=1.0.0-dev

EXPOSE 8090

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]
