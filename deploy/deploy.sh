#!/usr/bin/env bash
# GoLuckyTen deploy: pull, install, build, migrate, cache, reload.
# Run on the server as the deploy user from the project folder:  ./deploy/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/goluckyten.com}"
BRANCH="${BRANCH:-main}"
PHP="${PHP:-php8.4}"
cd "$APP_DIR"

echo "→ Maintenance mode"
$PHP artisan down --render="errors::503" --retry=15 || true
trap '$PHP artisan up >/dev/null 2>&1 || true' EXIT

echo "→ Pull $BRANCH"
git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "→ Composer"
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

echo "→ Frontend build"
npm ci --no-audit --no-fund
npm run build
rm -rf node_modules   # not needed at runtime

echo "→ Database"
$PHP artisan migrate --force

echo "→ Caches"
$PHP artisan storage:link >/dev/null 2>&1 || true
$PHP artisan optimize:clear >/dev/null
$PHP artisan optimize

echo "→ Permissions"
# Files PHP-FPM created belong to www-data and are skipped; they're already group-writable.
chgrp -R www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true
find storage bootstrap/cache -type d -user "$(id -u)" -exec chmod g+s {} + 2>/dev/null || true   # new files keep the www-data group

echo "→ Reload PHP-FPM (fresh OPcache)"
sudo systemctl reload "${PHP}-fpm"

$PHP artisan up
trap - EXIT
echo "✓ Deployed $(git rev-parse --short HEAD)"
