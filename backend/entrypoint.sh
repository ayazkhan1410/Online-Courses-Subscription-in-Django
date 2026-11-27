#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
python <<'PY'
import os
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()
from django.db import connection

for attempt in range(60):
    try:
        connection.ensure_connection()
        print('PostgreSQL is ready.')
        break
    except Exception as exc:
        print(f'Attempt {attempt + 1}/60: {exc}')
        time.sleep(2)
else:
    raise SystemExit('PostgreSQL did not become ready in time.')
PY

python manage.py migrate --noinput
python manage.py seed_catalog
python manage.py seed_paths
python manage.py ensure_superuser

PORT="${PORT:-4781}"
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers 2 \
  --threads 2 \
  --timeout 60 \
  --access-logfile -
