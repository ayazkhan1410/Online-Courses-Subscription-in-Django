#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
python <<'PY'
import os
import time

import psycopg

host = os.getenv('POSTGRES_HOST', 'db')
port = os.getenv('POSTGRES_PORT', '5432')
user = os.getenv('POSTGRES_USER', 'courses')
password = os.getenv('POSTGRES_PASSWORD', 'courses')
dbname = os.getenv('POSTGRES_DB', 'courses')

for attempt in range(60):
    try:
        with psycopg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname,
            connect_timeout=3,
        ) as conn:
            conn.execute('SELECT 1')
        print('PostgreSQL is ready.')
        break
    except Exception as exc:
        print(f'Attempt {attempt + 1}/60: {exc}')
        time.sleep(2)
else:
    raise SystemExit('PostgreSQL did not become ready in time.')
PY

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:4781 \
  --workers 2 \
  --timeout 120
