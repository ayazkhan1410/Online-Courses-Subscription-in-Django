FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libjpeg62-turbo-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# collectstatic during image build (not at boot). Manifest needs a key.
RUN DJANGO_DEBUG=True \
    DJANGO_SECRET_KEY=build-only-collectstatic \
    python manage.py collectstatic --noinput

RUN chmod +x /app/entrypoint.sh

EXPOSE 4781

ENTRYPOINT ["/app/entrypoint.sh"]
