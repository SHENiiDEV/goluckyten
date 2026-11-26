# Деплой GoLuckyTen на VPS

Сервер: Ubuntu 22.04 / 24.04 (Debian 12 тоже подходит), **nginx + PHP-FPM 8.4 + MySQL + Let's Encrypt (certbot)**.
Папка проекта: **`/var/www/goluckyten.com`**, домен: **goluckyten.com** (www → редирект на без www).
Все команды выполняются **от root**.

Готовые файлы лежат в репозитории в папке `deploy/`:

| Файл | Куда на сервере |
|---|---|
| `deploy/nginx/goluckyten.com.http-only.conf` | временный конфиг для первого сертификата |
| `deploy/nginx/goluckyten.com.conf` | `/etc/nginx/sites-available/goluckyten.com` |
| `deploy/nginx/goluckyten-ssl.conf` | `/etc/nginx/snippets/goluckyten-ssl.conf` |
| `deploy/php/99-goluckyten.ini` | `/etc/php/8.4/fpm/conf.d/99-goluckyten.ini` |
| `deploy/env.production.example` | `/var/www/goluckyten.com/.env` |
| `deploy/deploy.sh` | обновление сайта одной командой (от root) |

> ⚠️ **Перед открытием сайта для всех** прочитайте раздел «Перед запуском» в конце. Сейчас оплата — заглушка: любой «платёж» проходит без списания денег.

**Как устроены права.** Код принадлежит root, PHP-FPM работает от `www-data` и может писать только в `storage/` и `bootstrap/cache/`. Поэтому команды `artisan` запускаем от `www-data` (через функцию `artisan` из шага 2): иначе root создаст в `storage/` файлы, в которые сайт потом не сможет писать, и получится ошибка 500.

---

## 0. DNS

У регистратора домена создайте записи на IP вашего VPS:

```
A     goluckyten.com       → 203.0.113.10   (ваш IPv4)
A     www.goluckyten.com   → 203.0.113.10
AAAA  goluckyten.com       → ваш IPv6        (если есть)
AAAA  www.goluckyten.com   → ваш IPv6
```

Проверка: `dig +short goluckyten.com` должен вернуть IP сервера. Без этого certbot не выдаст сертификат.

## 1. Пакеты

Пропускайте то, что уже установлено.

```bash
apt update && apt upgrade -y
apt install -y nginx git unzip curl apache2-utils certbot

# PHP 8.4 (на Ubuntu через PPA ondrej/php)
add-apt-repository -y ppa:ondrej/php && apt update
apt install -y php8.4-fpm php8.4-cli php8.4-mysql php8.4-sqlite3 php8.4-mbstring \
  php8.4-xml php8.4-curl php8.4-zip php8.4-gd php8.4-intl php8.4-bcmath php8.4-gmp php8.4-opcache

# Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Node.js 22 LTS (нужен только для сборки фронтенда)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# MySQL 8
apt install -y mysql-server

# Firewall
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

Зачем расширения: `gd` — картинки в PDF-инвойсах (dompdf), `gmp` и `bcmath` — шифрование push-уведомлений, `intl` — форматирование, `mysql` — база.

## 2. Папки и команда `artisan`

```bash
mkdir -p /var/www/goluckyten.com /var/www/certbot

# Composer от root без предупреждений
echo 'export COMPOSER_ALLOW_SUPERUSER=1' >> /root/.bashrc

# artisan всегда от www-data, из любой папки
cat >> /root/.bashrc <<'EOF'
artisan() { runuser -u www-data -- php /var/www/goluckyten.com/artisan "$@"; }
EOF
source /root/.bashrc
```

Дальше в гайде пишем просто `artisan migrate`, `artisan optimize` и т.д.

## 3. Код

Репозиторий приватный? Дайте серверу ключ только на чтение:

```bash
ssh-keygen -t ed25519 -C "root@goluckyten" -f /root/.ssh/id_ed25519 -N ""
cat /root/.ssh/id_ed25519.pub
```
Скопируйте ключ в GitHub → репозиторий **SHENiiDEV/goluckyten** → Settings → Deploy keys → Add deploy key (без «Allow write access»).

```bash
cd /var/www/goluckyten.com
git clone git@github.com:SHENiiDEV/goluckyten.git .
# публичный репозиторий: git clone https://github.com/SHENiiDEV/goluckyten.git .
```

## 4. База данных и .env

Пароль базы генерируется случайно (32 символа, только буквы и цифры) и сразу записывается и в MySQL, и в `.env`. Придумывать и вводить его не нужно.

```bash
cd /var/www/goluckyten.com
[ -f .env ] || cp deploy/env.production.example .env

DB_PASS="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32)"

mysql <<SQL
CREATE DATABASE IF NOT EXISTS goluckyten CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'goluckyten'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'goluckyten'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON goluckyten.* TO 'goluckyten'@'localhost';
FLUSH PRIVILEGES;
SQL

sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" .env
unset DB_PASS

grep -c '^DB_PASSWORD=[A-Za-z0-9]\{32\}$' .env     # должно вывести 1
```

Пароль хранится только в MySQL и в `.env`; посмотреть: `grep DB_PASSWORD .env`. Сменить пароль: повторите этот блок, затем `artisan optimize`.

Остальные значения:

```bash
nano .env
```

Заполните оставшиеся `CHANGE_ME`:
- `MAIL_*` — SMTP вашего почтового сервиса (с него уйдут письма о заказах, инвойсы, напоминания, восстановление пароля);
- `COMPANY_NUMBER`, `COMPANY_ADDRESS` — реквизиты компании (футер, юр. страницы, инвойсы);
- `COMPANY_VAT_NUMBER` / `COMPANY_VAT_RATE` — если вы плательщик НДС.

`APP_DEBUG=false` и `APP_ENV=production` оставьте как есть.

```bash
chown root:www-data .env && chmod 640 .env     # читает только root и сайт
```

## 5. Первая установка

```bash
cd /var/www/goluckyten.com
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci && npm run build && rm -rf node_modules
chown -R www-data:www-data storage bootstrap/cache

php artisan key:generate --force   # от root: пишет только в .env
artisan migrate --force          # ⚠️ БЕЗ --seed: демо-данные (фейковые победители) в продакшен не нужны
php artisan storage:link         # симлинк в public/, создаёт root
artisan optimize
```

Ключи для браузерных push-уведомлений:

```bash
artisan push:vapid               # выведет две строки
nano .env                        # вставьте VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY
artisan optimize
```

**5.1. Разовая проверка на MySQL.** Все 60 тестов проходят на SQLite и PostgreSQL; MySQL в моём окружении запустить нельзя, поэтому один раз прогоните их на сервере. Тесты очищают базу, поэтому только на отдельной `goluckyten_test` и обязательно со сброшенным кешем конфига (иначе тесты возьмут боевую базу):

```bash
mysql -e "CREATE DATABASE goluckyten_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON goluckyten_test.* TO 'goluckyten'@'localhost';"
composer install --prefer-dist                 # временно с dev-пакетами
chown -R www-data:www-data storage bootstrap/cache
artisan optimize:clear                         # ⚠️ обязательно
runuser -u www-data -- env DB_CONNECTION=mysql DB_DATABASE=goluckyten_test php artisan test
composer install --no-dev --optimize-autoloader
chown -R www-data:www-data storage bootstrap/cache
artisan optimize
mysql -e "DROP DATABASE goluckyten_test;"
```
Если что-то упало, пришлите вывод, поправлю.

## 6. PHP-FPM

```bash
cp /var/www/goluckyten.com/deploy/php/99-goluckyten.ini /etc/php/8.4/fpm/conf.d/
systemctl restart php8.4-fpm
```

Там: загрузка файлов до 64 МБ (видео призов в админке), `memory_limit 256M`, OPcache + JIT. `opcache.validate_timestamps=0` значит, что PHP не перечитывает файлы на каждый запрос: после обновления кода нужен `systemctl reload php8.4-fpm` (это делает `deploy.sh`).

## 7. nginx + сертификат Let's Encrypt

**7.1. Временный HTTP-конфиг, чтобы certbot смог проверить домен:**

```bash
cp /var/www/goluckyten.com/deploy/nginx/goluckyten.com.http-only.conf /etc/nginx/sites-available/goluckyten.com
ln -sf /etc/nginx/sites-available/goluckyten.com /etc/nginx/sites-enabled/goluckyten.com
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
curl -I http://goluckyten.com      # должен ответить 200
```

**7.2. Сертификат на оба имени:**

```bash
certbot certonly --webroot -w /var/www/certbot \
  -d goluckyten.com -d www.goluckyten.com \
  --email support@goluckyten.com --agree-tos --no-eff-email
```

**7.3. Боевой конфиг:**

```bash
cp /var/www/goluckyten.com/deploy/nginx/goluckyten-ssl.conf /etc/nginx/snippets/
cp /var/www/goluckyten.com/deploy/nginx/goluckyten.com.conf /etc/nginx/sites-available/goluckyten.com
nginx -t && systemctl reload nginx
```

**7.4. Автопродление.** certbot уже поставил таймер (`systemctl list-timers | grep certbot`). Чтобы nginx подхватывал новый сертификат:

```bash
printf '#!/bin/sh\nsystemctl reload nginx\n' > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
certbot renew --dry-run
```

Что делает конфиг: HTTP и www → `https://goluckyten.com`, HSTS и заголовки безопасности, gzip, кеш на год для `/build/*` (файлы с хешем), `sw.js` и манифест без кеша (иначе PWA не обновится), PHP выполняется только через `index.php`, `.env` и `.git` никогда не отдаются.

## 8. Планировщик (розыгрыши и напоминания)

Без него конкурсы не закроются и не разыграются сами. Cron запускаем от `www-data`, по той же причине, что и `artisan`:

```bash
echo '* * * * * cd /var/www/goluckyten.com && php artisan schedule:run >> /dev/null 2>&1' | crontab -u www-data -
crontab -u www-data -l          # проверка
artisan schedule:list
```

Каждую минуту `raffles:auto-draw` закрывает конкурсы с прошедшей датой и проводит проверяемый розыгрыш, каждые 15 минут `raffles:remind` шлёт напоминания «розыгрыш завтра».

Отдельный queue worker сейчас не нужен: письма и уведомления отправляются сразу.

## 9. Администратор

1. Зарегистрируйтесь на https://goluckyten.com как обычный игрок.
2. На сервере: `artisan user:admin ваш@email.com`
3. Админка: https://goluckyten.com/admin. Забрать права: `artisan user:admin ваш@email.com --revoke`.

## 10. Проверка

```bash
curl -I http://goluckyten.com          # 301 → https://goluckyten.com/
curl -I https://www.goluckyten.com     # 301 → https://goluckyten.com/
curl -I https://goluckyten.com         # 200, strict-transport-security
curl -I https://goluckyten.com/.env    # 403/404
```

В браузере: главная, регистрация, письмо о сбросе пароля пришло, вход в админку, создание тестового конкурса, покупка, скачивание PDF-инвойса, страница `/raffles/{slug}/live`. Оценка TLS: https://www.ssllabs.com/ssltest/ (ожидается A или A+).

## 11. Обновления

На своём компьютере: `git push`. На сервере:

```bash
/var/www/goluckyten.com/deploy/deploy.sh
```

Скрипт включает режим обслуживания, подтягивает `main`, ставит зависимости, собирает фронтенд, выполняет миграции, пересобирает кеши, поправляет права, перезагружает PHP-FPM и открывает сайт. Обычно 1–2 минуты.

Откат на прошлый коммит:
```bash
cd /var/www/goluckyten.com
git reset --hard <коммит>
composer install --no-dev --optimize-autoloader && npm ci && npm run build && rm -rf node_modules
chown -R www-data:www-data storage bootstrap/cache
artisan optimize && systemctl reload php8.4-fpm
```
Миграции откатывайте только осознанно: `artisan migrate:rollback`.

## 12. Бэкапы

База каждую ночь, хранить 14 дней:

```bash
mkdir -p /var/backups/goluckyten && chmod 700 /var/backups/goluckyten
crontab -e
```
```
15 3 * * * mysqldump --single-transaction --routines goluckyten | gzip > /var/backups/goluckyten/db-$(date +\%F).sql.gz && find /var/backups/goluckyten -name 'db-*.sql.gz' -mtime +14 -delete
```
(root подключается к MySQL через сокет без пароля.)

Ещё сохраняйте `/var/www/goluckyten.com/.env` и `storage/app/public` (загруженные фото и видео призов). Копии держите и вне сервера (rclone в S3/Backblaze или просто `scp` к себе).

Восстановление: `gunzip < /var/backups/goluckyten/db-2026-11-26.sql.gz | mysql goluckyten`.

## 13. Если что-то не так

| Симптом | Причина и решение |
|---|---|
| `SQLSTATE[HY000] [1045] Access denied` | Неверные `DB_USERNAME`/`DB_PASSWORD` в `.env`, после правки `artisan optimize`. |
| **502 Bad Gateway** | PHP-FPM не запущен или другой сокет: `systemctl status php8.4-fpm`, путь `ls /run/php/`. |
| **500**, пустая страница | `tail -50 /var/www/goluckyten.com/storage/logs/laravel-*.log`. Частое: файлы в `storage` от root (запускали `php artisan` вместо `artisan`). Лечится: `chown -R www-data:www-data storage bootstrap/cache`. |
| Стили и скрипты не грузятся | Не выполнен `npm run build` → нет `public/build`. |
| Изменения в `.env` не применяются | Конфиг закеширован: `artisan optimize`. |
| Изменения кода не видны | OPcache: `systemctl reload php8.4-fpm`. |
| Конкурсы не разыгрываются | Нет cron из шага 8: `crontab -u www-data -l`. |
| Письма не приходят | Проверьте `MAIL_*`, затем `artisan tinker` → `Mail::raw('test', fn($m) => $m->to('вы@почта'));`. |
| Push не работают | Нужны `VAPID_*` в `.env` и HTTPS; после правки `.env` — `artisan optimize`. |
| certbot: «Connection refused / unauthorized» | DNS ещё не указывает на сервер или закрыт порт 80 (`ufw status`). |

## Перед запуском

- [ ] **Настоящая оплата.** Сейчас стоит `StubGateway`: «оплата» всегда проходит, деньги не списываются. Пока не подключён Stripe/Adyen и т.п., закройте сайт паролем — в `goluckyten.com.conf` раскомментируйте `auth_basic` (команда для пароля есть рядом в комментарии).
- [ ] В базе нет демо-данных (не запускали `--seed`).
- [ ] `APP_DEBUG=false`, `APP_ENV=production`.
- [ ] Реквизиты компании, адрес, email заполнены, почта отправляется.
- [ ] Terms, Privacy, Cookie Policy проверены юристом; для игроков из UK — соответствие правилам призовых конкурсов (бесплатный способ участия уже есть, раздел 6 Terms).
- [ ] Настоящие фото призов (сгенерированные картинки не должны выдаваться за реальные призы).
- [ ] Бэкапы работают: появился первый файл в `/var/backups/goluckyten`.
