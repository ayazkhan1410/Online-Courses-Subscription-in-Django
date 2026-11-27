#!/usr/bin/env bash
# Vercel build: migrate + seed + admin + static. Fail the deploy on migrate errors.
set -euo pipefail

echo "migrate…"
python manage.py migrate --noinput

echo "seed_catalog…"
python manage.py seed_catalog

echo "seed_paths…"
python manage.py seed_paths

echo "ensure_superuser…"
python manage.py ensure_superuser

echo "collectstatic…"
python manage.py collectstatic --noinput

echo "build complete."
