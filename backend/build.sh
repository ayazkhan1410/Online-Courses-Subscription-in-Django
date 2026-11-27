#!/usr/bin/env bash
# Vercel build: migrate + seed + admin + static. Fail the deploy on migrate errors.
set -euo pipefail

echo "migrate…"
python manage.py migrate --noinput

# Seeding row by row from Vercel's build region to Neon (Singapore) is too slow for the build
# limit, so it only runs when asked. Seed once from a nearby machine instead (docs/DEPLOY.md).
if [ "${SEED_ON_BUILD:-0}" = "1" ]; then
  echo "seed_catalog…"
  python manage.py seed_catalog
  echo "seed_paths…"
  python manage.py seed_paths
fi

echo "ensure_superuser…"
python manage.py ensure_superuser

echo "collectstatic…"
python manage.py collectstatic --noinput

echo "build complete."
