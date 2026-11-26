#!/bin/sh
set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:4781/api}"

cat > /usr/share/nginx/html/js/config.js <<EOF
window.APP_CONFIG = {
  API_BASE_URL: "${API_BASE_URL}"
};
EOF

exec nginx -g 'daemon off;'
