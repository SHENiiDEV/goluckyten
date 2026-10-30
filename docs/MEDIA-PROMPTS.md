# Промты для картинок и видео

Все промты написаны на английском: Midjourney, Flux, Ideogram, DALL·E, Sora, Veo, Kling и Runway понимают его лучше.
К каждому промту картинки добавляйте **общий стиль** из блока ниже, чтобы весь сайт выглядел как одна съёмка.

---

## 1. Общий стиль (добавлять в конец каждого промта)

```
premium automotive and luxury product photography, dark aubergine-black studio backdrop (#0D0A12),
electric violet rim light (#7B5CFA) with a cool white key light, subtle haze, glossy reflective black floor, crisp and realistic, competition-site hero shot,
85mm lens, shallow depth of field, ultra-detailed, photorealistic, rich contrast, no text, no watermark, no logos added, no people
```

Негатив (если генератор поддерживает): `text, letters, watermark, logo overlay, cartoon, illustration, low quality, blurry, distorted, extra wheels, bent metal, deformed hands`

Параметры:
- **Обложка розыгрыша:** 4:3, минимум 1600×1200. Midjourney: `--ar 4:3 --style raw --v 7`
- **Галерея:** 4:3, тот же размер, 2–4 кадра на приз
- **Instant-призы (иконки):** 1:1, 800×800
- **Hero-постер:** 16:9, 2560×1440
- Сохраняйте в JPG/WebP, до 400 KB (можно прогнать через squoosh.app)

---

## 2. Куда класть файлы

```
public/images/hero-poster.jpg                      ← кадр для фона главной (пока видео грузится)
public/videos/hero.mp4                             ← фоновое видео на главной
public/images/prizes/{slug}/cover.jpg              ← обложка розыгрыша
public/images/prizes/{slug}/2.jpg, 3.jpg, 4.jpg    ← галерея
public/videos/prizes/{slug}.mp4                    ← видео приза (первое в галерее)
public/images/instant/cash.jpg                     ← иконка денежного instant-приза
public/images/instant/airpods-pro.jpg
public/images/instant/ps5-pro.jpg
public/images/instant/apple-watch-ultra.jpg
```

Потом выполните:

```bash
php artisan raffles:sync-media       # подхватит файлы и привяжет их к розыгрышам по slug
```

Сейчас в демо-данных стоят бесплатные фото с Unsplash (подгружаются по ссылке), чтобы сайт выглядел живым сразу. Свои файлы их заменяют автоматически после `raffles:sync-media`.

Пересоздание базы (`php artisan migrate:fresh --seed`) тоже вызывает эту команду. Пока файла нет, на сайте показывается золотая иллюстрация, так что ничего не ломается.

---

## 3. Розыгрыши

### porsche-911-carrera-s — Porsche 911 Carrera S

- **cover.jpg:** `A brand-new Porsche 911 Carrera S (992 generation) in GT Silver metallic, three-quarter front view, parked on a glossy black studio floor, headlights on, gold rim light tracing the iconic roofline, [STYLE]`
- **2.jpg:** `Rear three-quarter view of a Porsche 911 Carrera S in GT Silver, full-width LED light bar glowing, low camera angle, reflections on the floor, [STYLE]`
- **3.jpg:** `Interior of a Porsche 911 Carrera S, black and Bordeaux red leather, curved digital instrument cluster, steering wheel in focus, warm gold accent lighting, [STYLE]`
- **4.jpg:** `Close-up detail of a 21-inch Porsche alloy wheel and red brake caliper on a 911, water droplets, macro, [STYLE]`

### rolex-submariner-date — Rolex Submariner Date

- **cover.jpg:** `A Rolex Submariner Date 41mm in Oystersteel with black dial and black ceramic bezel, standing upright on a polished black stone plinth, gold spotlight glinting off the bracelet, [STYLE]`
- **2.jpg:** `Macro close-up of a black Submariner dial: luminous hour markers, cyclops date lens, Mercedes hands, [STYLE]`
- **3.jpg:** `Submariner watch lying on its side next to its green presentation box and papers, top-down three-quarter angle, [STYLE]`

### instant-win-cash-50000 — €50,000 Instant Win Cash

- **cover.jpg:** `Neat stacks of crisp euro banknotes (€500, €200, €100) arranged in a pyramid on a black glossy surface, a few notes fanned out in front, golden light beams from above, floating gold confetti, [STYLE]`
- **2.jpg:** `An open black leather briefcase full of banded euro banknotes, lid catching gold light, [STYLE]`
- **3.jpg:** `A single golden raffle ticket with a torn perforated edge floating above a stack of euro notes, sparks of gold light, [STYLE]`

### range-rover-sport — Range Rover Sport Autobiography

- **cover.jpg:** `A new Range Rover Sport Autobiography in Charente Grey, three-quarter front view, clean minimalist lines, standing in a dark studio with a reflective floor, [STYLE]`
- **2.jpg:** `Side profile of a Range Rover Sport, 23-inch wheels, flush door handles, gold rim light along the beltline, [STYLE]`
- **3.jpg:** `Luxury cabin of a Range Rover Sport, light semi-aniline leather seats, floating touchscreen, ambient lighting, [STYLE]`

### audemars-piguet-royal-oak — Audemars Piguet Royal Oak 41

- **cover.jpg:** `An Audemars Piguet Royal Oak 41mm in stainless steel with the blue Grande Tapisserie dial, octagonal bezel with eight hexagonal screws, integrated bracelet, angled on a black velvet cushion, [STYLE]`
- **2.jpg:** `Macro of the blue Grande Tapisserie waffle-pattern dial and baton hands, reflections on the brushed steel, [STYLE]`
- **3.jpg:** `Royal Oak bracelet draped over a black marble block, alternating brushed and polished links catching gold light, [STYLE]`

### mercedes-amg-g63 — Mercedes-AMG G 63

- **cover.jpg:** `A Mercedes-AMG G 63 in matte obsidian black, front three-quarter view, boxy silhouette, round headlights glowing, standing in a dark studio with haze and gold backlight, [STYLE]`
- **2.jpg:** `Rear of a Mercedes G-Class with side-exit exhaust pipes, spare wheel cover, low angle, [STYLE]`
- **3.jpg:** `Interior of a Mercedes-AMG G 63, red and black diamond-stitched leather, widescreen cockpit display, [STYLE]`

### apple-ultimate-bundle — Apple ultimate bundle

- **cover.jpg:** `Flat-lay hero shot of a premium tech bundle: a titanium smartphone, an open 16-inch silver laptop, a tablet with keyboard and a rugged titanium smartwatch, arranged symmetrically on a black glossy surface, soft gold light, [STYLE]`
- **2.jpg:** `Close-up of a titanium smartphone standing upright, triple camera module catching the light, [STYLE]`
- **3.jpg:** `Rugged titanium smartwatch with an orange band lying on black slate, [STYLE]`

### cartier-love-bracelet — Cartier Love bracelet

- **cover.jpg:** `An 18k yellow gold Cartier Love bracelet with screw motifs, resting on a black velvet jewellery bust, the small gold screwdriver beside it, intense warm highlights, [STYLE]`
- **2.jpg:** `Macro of the screw motifs on a polished yellow gold bangle, [STYLE]`
- **3.jpg:** `Red Cartier-style presentation box open with the gold bracelet inside, [STYLE]`

### maldives-overwater-villa — Maldives overwater villa

- **cover.jpg:** `Aerial view at golden hour of a private overwater villa in the Maldives with its own infinity pool, turquoise lagoon, wooden walkway, cinematic, photorealistic, no people, no text`
- **2.jpg:** `Inside an overwater villa at dusk: a king bed facing floor-to-ceiling windows over the lagoon, warm lamps, photorealistic, no text`
- **3.jpg:** `A seaplane landing on a turquoise lagoon near a coral island, sunset, photorealistic, no text`

### Прошедшие розыгрыши (для страницы победителей)

- **bmw-m4-competition/cover.jpg:** `A BMW M4 Competition coupé in Isle of Man Green, three-quarter front view, [STYLE]`
- **omega-speedmaster-moonwatch/cover.jpg:** `An Omega Speedmaster Moonwatch chronograph with black dial on a steel bracelet, propped on a black stone, [STYLE]`
- **cash-10000-september/cover.jpg:** `A tidy stack of €100 banknotes tied with a gold band on black glass, [STYLE]`

---

## 3a. Баннер-заголовок

Крупный текст на слайдах главной («WIN A PORSCHE 911 FOR €19.99») и фиолетовая плашка («JACKPOT», «ENDS TONIGHT») рисуются сайтом поверх фото, в картинку текст вписывать не нужно. Заголовок и плашка редактируются в админке (поля Headline и Promo label). Поэтому для обложек оставляйте свободное, не слишком пёстрое место в нижней трети кадра.

## 3b. Лендинг (`/landing`)

**public/images/landing/hero.png** — прозрачный PNG, примерно 1200×1200. Если файла нет, в hero показывается фото главного приза в круге.

```
3D render of an overflowing purple velvet prize bag tied with a gold rope, euro banknotes and gold coins spilling out,
a golden raffle ticket and a luxury car key resting on top, soft studio lighting with violet (#7B5CFA) and pink (#FF3D9A) rim light,
isolated on a fully transparent background, high detail, glossy, playful premium style, no text, no logos
```

## 4. Instant-призы (1:1)

- **instant/cash.jpg:** `A fan of euro banknotes held by a gold money clip, centred, on a black background with a soft gold glow, square composition, [STYLE]`
- **instant/airpods-pro.jpg:** `White wireless earbuds in an open charging case, centred, square, [STYLE]`
- **instant/ps5-pro.jpg:** `A white next-generation game console standing upright with a controller, centred, square, [STYLE]`
- **instant/apple-watch-ultra.jpg:** `A rugged titanium smartwatch with an orange alpine band, centred, square, [STYLE]`

---

## 5. Видео

Требования: 1920×1080, 8–12 секунд, **бесшовный цикл** (последний кадр совпадает с первым), без текста, без звука, MP4 (H.264).
Сжатие перед загрузкой (цель 3–8 MB):

```bash
ffmpeg -i input.mp4 -vf "scale=1920:-2,fps=30" -c:v libx264 -preset veryfast -crf 26 -an -movflags +faststart public/videos/hero.mp4
```

### hero.mp4 — фон главной

```
Slow cinematic dolly shot through a dark luxury showroom at night. A silver sports car, a black luxury SUV and a glass display
case with a gold wristwatch sit under pools of warm gold light on a reflective black floor. Floating violet light particles drift
slowly through soft blue haze. The camera glides left to right at walking pace and ends where it began for a seamless loop.
Moody, premium commercial, deep black with electric violet light accents, no people, no text, 16:9, 10 seconds.
```

Возьмите самый красивый кадр, сохраните его как `public/images/hero-poster.jpg`.

### Видео призов (`public/videos/prizes/{slug}.mp4`)

- **porsche-911-carrera-s:** `Slow 180-degree orbit around a silver Porsche 911 Carrera S in a dark studio, headlights on, gold rim light sweeping along the bodywork, reflective floor, seamless loop, no text, 8 seconds`
- **rolex-submariner-date:** `Macro slow rotation of a black-dial diver's watch on a turntable, light glinting across the ceramic bezel and bracelet, dark background, gold highlights, seamless loop, 8 seconds`
- **instant-win-cash-50000:** `Euro banknotes and gold confetti falling in slow motion onto a glossy black surface, warm gold spotlight, seamless loop, 8 seconds`
- **mercedes-amg-g63:** `Black Mercedes G-Class emerging from haze in a dark studio, headlights switching on, slow push-in, seamless loop, 8 seconds`

---

## 6. Важно перед запуском

Сгенерированные картинки подходят для дизайна и демо. Для живых розыгрышей на странице приза должен быть **именно тот товар, который получит победитель**: настоящие фото от дилера или поставщика (комплектация, цвет, состояние). Иначе выйдет вводящая в заблуждение реклама. Логотипы и названия брендов используйте только для описания приза, не так, будто бренд спонсирует розыгрыш, если у вас нет с ним договора.
