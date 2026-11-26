#!/bin/sh
set -e

# Seed persistent DB volume from image copy on first boot
if [ -n "${DJANGO_DB_PATH}" ]; then
  mkdir -p "$(dirname "${DJANGO_DB_PATH}")"
  if [ ! -f "${DJANGO_DB_PATH}" ] && [ -f /app/db.sqlite3 ]; then
    cp /app/db.sqlite3 "${DJANGO_DB_PATH}"
  fi
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:4781 \
  --workers 2 \
  --timeout 120
