#!/usr/bin/env bash
# GoLuckyTen deploy: pull, install, build, migrate, cache, reload.
# Run on the server as root:  /var/www/goluckyten.com/deploy/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/goluckyten.com}"
BRANCH="${BRANCH:-main}"
PHP="${PHP:-php8.4}"
export COMPOSER_ALLOW_SUPERUSER=1
cd "$APP_DIR"

# Code belongs to root; PHP-FPM (www-data) writes only to storage/ and bootstrap/cache/.
# artisan runs as www-data so it never leaves root-owned files there.
artisan() { runuser -u www-data -- "$PHP" "$APP_DIR/artisan" "$@"; }

echo "→ Maintenance mode"
artisan down --render="errors::503" --retry=15 || true
trap 'artisan up >/dev/null 2>&1 || true' EXIT

echo "→ Pull $BRANCH"
git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "→ Composer"
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

echo "→ Permissions"
chown -R www-data:www-data storage bootstrap/cache

echo "→ Frontend build"
npm ci --no-audit --no-fund
npm run build
rm -rf node_modules   # not needed at runtime

echo "→ Database"
artisan migrate --force

echo "→ Caches"
[ -L public/storage ] || "$PHP" artisan storage:link
artisan optimize:clear >/dev/null
artisan optimize

echo "→ Reload PHP-FPM (fresh OPcache)"
systemctl reload "${PHP}-fpm"

artisan up
trap - EXIT
echo "✓ Deployed $(git rev-parse --short HEAD)"
