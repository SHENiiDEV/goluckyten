# Деплой GoLuckyTen на VPS

Сервер: Ubuntu 22.04 / 24.04 (Debian 12 тоже подходит), **nginx + PHP-FPM 8.4 + Let's Encrypt (certbot)**.
Папка проекта: **`/var/www/goluckyten.com`**, домен: **goluckyten.com** (www → редирект на без www).

Готовые файлы лежат в репозитории в папке `deploy/`:

| Файл | Куда на сервере |
|---|---|
| `deploy/nginx/goluckyten.com.http-only.conf` | временный конфиг для первого сертификата |
| `deploy/nginx/goluckyten.com.conf` | `/etc/nginx/sites-available/goluckyten.com` |
| `deploy/nginx/goluckyten-ssl.conf` | `/etc/nginx/snippets/goluckyten-ssl.conf` |
| `deploy/php/99-goluckyten.ini` | `/etc/php/8.4/fpm/conf.d/99-goluckyten.ini` |
| `deploy/env.production.example` | `/var/www/goluckyten.com/.env` |
| `deploy/deploy.sh` | запускается из папки проекта для обновлений |

> ⚠️ **Перед открытием сайта для всех** прочитайте раздел «Перед запуском» в конце. Сейчас оплата — заглушка: любой «платёж» проходит без списания денег.

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

Всё ниже выполняется под пользователем с `sudo`. Пропускайте то, что уже установлено.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git unzip curl acl apache2-utils certbot

# PHP 8.4 (на Ubuntu через PPA ondrej/php)
sudo add-apt-repository -y ppa:ondrej/php && sudo apt update
sudo apt install -y php8.4-fpm php8.4-cli php8.4-mysql php8.4-sqlite3 php8.4-mbstring \
  php8.4-xml php8.4-curl php8.4-zip php8.4-gd php8.4-intl php8.4-bcmath php8.4-gmp php8.4-opcache

# Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Node.js 22 LTS (нужен только для сборки фронтенда)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Firewall
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

Зачем расширения: `gd` — картинки в PDF-инвойсах (dompdf), `gmp` и `bcmath` — шифрование push-уведомлений, `intl` — форматирование, `mysql` — база.

## 2. Пользователь для деплоя

Код принадлежит отдельному пользователю `deploy`, PHP-FPM работает от `www-data` и пишет только в `storage/` и `bootstrap/cache/`.

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG www-data deploy
echo 'umask 002' | sudo tee -a /home/deploy/.profile

# deploy.sh перезагружает PHP-FPM без пароля, больше ничего
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl reload php8.4-fpm' | sudo tee /etc/sudoers.d/deploy-goluckyten
sudo chmod 440 /etc/sudoers.d/deploy-goluckyten

sudo mkdir -p /var/www/goluckyten.com /var/www/certbot
sudo chown deploy:www-data /var/www/goluckyten.com
```

## 3. База данных (MySQL)

Локально проект работает на SQLite, на сервере берём MySQL 8 (или MariaDB 10.11+). Если MySQL уже стоит, пропустите `apt install`.

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation      # если ставите впервые

sudo mysql <<'SQL'
CREATE DATABASE goluckyten CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'goluckyten'@'localhost' IDENTIFIED BY 'ПРИДУМАЙТЕ_ДЛИННЫЙ_ПАРОЛЬ';
GRANT ALL PRIVILEGES ON goluckyten.* TO 'goluckyten'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Все 60 тестов проходят на SQLite и PostgreSQL; MySQL в моём окружении запустить нельзя, поэтому после шага 6 один раз прогоните тесты на сервере, на отдельной пустой базе (шаг 6.1).

## 4. Код

```bash
sudo -iu deploy
```

Репозиторий приватный? Дайте серверу ключ только на чтение:

```bash
ssh-keygen -t ed25519 -C "deploy@goluckyten" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```
Скопируйте ключ в GitHub → репозиторий **SHENiiDEV/goluckyten** → Settings → Deploy keys → Add deploy key (без «Allow write access»).

```bash
cd /var/www/goluckyten.com
git clone git@github.com:SHENiiDEV/goluckyten.git .
# публичный репозиторий: git clone https://github.com/SHENiiDEV/goluckyten.git .
```

## 5. .env

```bash
cp deploy/env.production.example .env
nano .env
```

Заполните все `CHANGE_ME`:
- `DB_PASSWORD` — пароль из шага 3;
- `MAIL_*` — SMTP вашего почтового сервиса (с него уйдут письма о заказах, инвойсы, напоминания, восстановление пароля);
- `COMPANY_NUMBER`, `COMPANY_ADDRESS` — реквизиты компании (футер, юр. страницы, инвойсы);
- `COMPANY_VAT_NUMBER` / `COMPANY_VAT_RATE` — если вы плательщик НДС.

`APP_DEBUG=false` и `APP_ENV=production` оставьте как есть.

```bash
chmod 640 .env && chgrp www-data .env
```

## 6. Первая установка

```bash
cd /var/www/goluckyten.com
composer install --no-dev --prefer-dist --optimize-autoloader
php artisan key:generate --force

npm ci && npm run build && rm -rf node_modules

php artisan migrate --force          # ⚠️ БЕЗ --seed: демо-данные (фейковые победители) в продакшен не нужны
php artisan storage:link

chgrp -R www-data storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache
find storage bootstrap/cache -type d -exec chmod g+s {} +

php artisan optimize
```

**6.1. Разовая проверка на MySQL.** Тесты очищают базу, поэтому запускаем их на отдельной `goluckyten_test` и обязательно со сброшенным кешем конфига (иначе тесты возьмут боевую базу):

```bash
sudo mysql -e "CREATE DATABASE goluckyten_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL ON goluckyten_test.* TO 'goluckyten'@'localhost';"
composer install --prefer-dist                 # временно с dev-пакетами
php artisan optimize:clear                     # ⚠️ обязательно
DB_CONNECTION=mysql DB_DATABASE=goluckyten_test php artisan test
composer install --no-dev --optimize-autoloader
php artisan optimize
sudo mysql -e "DROP DATABASE goluckyten_test;"
```
Если что-то упало, пришлите вывод, поправлю.

Ключи для браузерных push-уведомлений:

```bash
php artisan push:vapid          # выведет две строки
nano .env                       # вставьте VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY
php artisan optimize
```

## 7. PHP-FPM

```bash
exit   # обратно в своего sudo-пользователя
sudo cp /var/www/goluckyten.com/deploy/php/99-goluckyten.ini /etc/php/8.4/fpm/conf.d/
sudo systemctl restart php8.4-fpm
```

Там: загрузка файлов до 64 МБ (видео призов в админке), `memory_limit 256M`, OPcache + JIT. `opcache.validate_timestamps=0` значит, что PHP не перечитывает файлы на каждый запрос: после обновления кода нужен `reload php8.4-fpm` (это делает `deploy.sh`).

## 8. nginx + сертификат Let's Encrypt

**8.1. Временный HTTP-конфиг, чтобы certbot смог проверить домен:**

```bash
sudo cp /var/www/goluckyten.com/deploy/nginx/goluckyten.com.http-only.conf /etc/nginx/sites-available/goluckyten.com
sudo ln -sf /etc/nginx/sites-available/goluckyten.com /etc/nginx/sites-enabled/goluckyten.com
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl -I http://goluckyten.com      # должен ответить 200
```

**8.2. Сертификат на оба имени:**

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d goluckyten.com -d www.goluckyten.com \
  --email support@goluckyten.com --agree-tos --no-eff-email
```

**8.3. Боевой конфиг:**

```bash
sudo cp /var/www/goluckyten.com/deploy/nginx/goluckyten-ssl.conf /etc/nginx/snippets/
sudo cp /var/www/goluckyten.com/deploy/nginx/goluckyten.com.conf /etc/nginx/sites-available/goluckyten.com
sudo nginx -t && sudo systemctl reload nginx
```

**8.4. Автопродление.** certbot уже поставил таймер (`systemctl list-timers | grep certbot`). Чтобы nginx подхватывал новый сертификат:

```bash
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo certbot renew --dry-run
```

Что делает конфиг: HTTP и www → `https://goluckyten.com`, HSTS и заголовки безопасности, gzip, кеш на год для `/build/*` (файлы с хешем), `sw.js` и манифест без кеша (иначе PWA не обновится), PHP выполняется только через `index.php`, `.env` и `.git` никогда не отдаются.

## 9. Планировщик (розыгрыши и напоминания)

Без него конкурсы не закроются и не разыграются сами.

```bash
sudo crontab -u www-data -e
```
Добавьте строку:
```
* * * * * cd /var/www/goluckyten.com && php artisan schedule:run >> /dev/null 2>&1
```

Каждую минуту `raffles:auto-draw` закрывает конкурсы с прошедшей датой и проводит проверяемый розыгрыш, каждые 15 минут `raffles:remind` шлёт напоминания «розыгрыш завтра». Проверка: `sudo -u www-data php /var/www/goluckyten.com/artisan schedule:list`.

Отдельный queue worker сейчас не нужен: письма и уведомления отправляются сразу.

## 10. Администратор

1. Зарегистрируйтесь на https://goluckyten.com как обычный игрок.
2. На сервере:
   ```bash
   cd /var/www/goluckyten.com && php artisan user:admin ваш@email.com
   ```
3. Админка: https://goluckyten.com/admin. Забрать права: `php artisan user:admin ваш@email.com --revoke`.

## 11. Проверка

```bash
curl -I http://goluckyten.com          # 301 → https://goluckyten.com/
curl -I https://www.goluckyten.com     # 301 → https://goluckyten.com/
curl -I https://goluckyten.com         # 200, strict-transport-security
curl -I https://goluckyten.com/.env    # 403/404
```

В браузере: главная, регистрация, письмо о регистрации/сбросе пароля пришло, вход в админку, создание тестового конкурса, покупка, скачивание PDF-инвойса, страница `/raffles/{slug}/live`. Оценка TLS: https://www.ssllabs.com/ssltest/ (ожидается A или A+).

## 12. Обновления

На своём компьютере: `git push`. На сервере:

```bash
sudo -iu deploy
cd /var/www/goluckyten.com && ./deploy/deploy.sh
```

Скрипт включает режим обслуживания, подтягивает `main`, ставит зависимости, собирает фронтенд, выполняет миграции, пересобирает кеши, перезагружает PHP-FPM и открывает сайт. Обычно 1–2 минуты.

Откат на прошлый коммит: `git reset --hard <коммит> && composer install --no-dev && npm ci && npm run build && php artisan optimize && sudo systemctl reload php8.4-fpm` (миграции откатывать только осознанно: `php artisan migrate:rollback`).

## 13. Бэкапы

База каждую ночь, хранить 14 дней:

```bash
sudo mkdir -p /var/backups/goluckyten && sudo chmod 700 /var/backups/goluckyten
sudo crontab -e
```
```
15 3 * * * mysqldump --single-transaction --routines goluckyten | gzip > /var/backups/goluckyten/db-$(date +\%F).sql.gz && find /var/backups/goluckyten -name 'db-*.sql.gz' -mtime +14 -delete
```
(root подключается к MySQL через сокет без пароля, как `sudo mysql`.)

Ещё сохраняйте `/var/www/goluckyten.com/.env` и `storage/app/public` (загруженные фото и видео призов). Копии держите и вне сервера (rclone в S3/Backblaze или просто `scp` к себе).

Восстановление: `gunzip < /var/backups/goluckyten/db-2026-11-26.sql.gz | sudo mysql goluckyten`.

## 14. Если что-то не так

| Симптом | Причина и решение |
|---|---|
| `SQLSTATE[HY000] [1045] Access denied` | Неверные `DB_USERNAME`/`DB_PASSWORD` в `.env`, после правки `php artisan optimize`. |
| **502 Bad Gateway** | PHP-FPM не запущен или другой сокет: `systemctl status php8.4-fpm`, путь `ls /run/php/`. |
| **500**, пустая страница | `tail -50 storage/logs/laravel-*.log`. Частое: права на `storage` (повторите команды chgrp/chmod из шага 6) или нет `APP_KEY`. |
| Стили и скрипты не грузятся | Не выполнен `npm run build` → нет `public/build`. |
| Изменения в `.env` не применяются | Конфиг закеширован: `php artisan optimize`. |
| Изменения кода не видны | OPcache: `sudo systemctl reload php8.4-fpm`. |
| Конкурсы не разыгрываются | Нет cron из шага 9: `sudo crontab -u www-data -l`. |
| Письма не приходят | Проверьте `MAIL_*`, затем `php artisan tinker` → `Mail::raw('test', fn($m) => $m->to('вы@почта'));`. |
| Push не работают | Нужны `VAPID_*` в `.env` и HTTPS; после правки `.env` — `php artisan optimize`. |
| certbot: «Connection refused / unauthorized» | DNS ещё не указывает на сервер или закрыт порт 80 (`ufw status`). |

## Перед запуском

- [ ] **Настоящая оплата.** Сейчас стоит `StubGateway`: «оплата» всегда проходит, деньги не списываются. Пока не подключён Stripe/Adyen и т.п., закройте сайт паролем — в `goluckyten.com.conf` раскомментируйте `auth_basic` (команда для пароля есть рядом в комментарии).
- [ ] В базе нет демо-данных (не запускали `--seed`).
- [ ] `APP_DEBUG=false`, `APP_ENV=production`.
- [ ] Реквизиты компании, адрес, email заполнены, почта отправляется.
- [ ] Terms, Privacy, Cookie Policy проверены юристом; для игроков из UK — соответствие правилам призовых конкурсов (бесплатный способ участия уже есть, раздел 6 Terms).
- [ ] Настоящие фото призов (сгенерированные картинки не должны выдаваться за реальные призы).
- [ ] Бэкапы работают: появился первый файл в `/var/backups/goluckyten`.
