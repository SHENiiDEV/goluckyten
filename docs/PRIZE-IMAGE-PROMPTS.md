# Промты для картинок призов (52 новых конкурса)

Картинки для конкурсов из `database/seeders/RaffleCatalogueMore.php`. Пока у конкурса нет обложки, на сайте показывается фирменная иллюстрация, так что можно добавлять постепенно.

## Как добавить

1. Сгенерируйте **обложку** (обязательно) и по желанию 1–3 кадра для галереи.
2. Сохраните в папку конкурса, имя папки = slug:
   ```
   public/images/prizes/{slug}/cover.jpg   ← обложка
   public/images/prizes/{slug}/2.jpg       ← галерея (3.jpg, 4.jpg ...)
   ```
   Формат 4:3, от 1600×1200, JPG или WebP до ~400 KB (сжать можно на squoosh.app).
3. Закоммитьте и задеплойте, затем на сервере:
   ```bash
   artisan raffles:sync-media
   ```
   Если конкурсов ещё нет в базе, `artisan db:seed --class=CatalogueSeeder --force` сам подхватит картинки из этих папок.

## Общий стиль

Добавляйте в конец каждого промта, чтобы все фото выглядели как одна съёмка.

**Товары (машины, часы, техника, деньги, украшения):**
```
premium luxury product photography, dark aubergine-black studio backdrop (#0D0A12), electric violet rim light (#7B5CFA) with soft white key light, subtle haze, glossy reflective floor, photorealistic, ultra-detailed, 4:3, no text, no watermark, no added logos, no people
```

**Места и интерьеры (путешествия, дом):**
```
premium travel photography, cinematic golden-hour or blue-hour light, subtle violet colour grade in the shadows, photorealistic, ultra-detailed, 4:3, no text, no watermark, no people in focus
```

Негатив (если генератор поддерживает): `text, letters, watermark, logo overlay, real banknote serial numbers, cartoon, illustration, low quality, blurry, distorted, deformed hands`

Midjourney: в конце `--ar 4:3 --style raw --v 7`.

⚠️ Сгенерированные картинки — только иллюстрация. Перед стартом продаж конкурса замените их на настоящие фото приза или подпишите на странице, что изображение иллюстративное.

## Машины и мотоциклы

### Porsche Taycan 4S
Папка: `public/images/prizes/porsche-taycan-4s/` · стиль: товар

**Обложка (cover.jpg):**
```
Porsche Taycan 4S electric sports saloon, three-quarter front view, Frozen Blue metallic paint, light bar glowing, hero shot
```
**Галерея (2.jpg, 3.jpg):** interior with curved digital display; rear three-quarter with full-width light bar

### Audi RS 6 Avant performance
Папка: `public/images/prizes/audi-rs6-avant/` · стиль: товар

**Обложка (cover.jpg):**
```
Audi RS 6 Avant performance estate, Nardo Grey, low front three-quarter view, wide wheel arches, carbon details, hero shot
```
**Галерея (2.jpg, 3.jpg):** side profile; quattro badge and 22-inch wheel close-up

### Tesla Model Y Performance
Папка: `public/images/prizes/tesla-model-y-performance/` · стиль: товар

**Обложка (cover.jpg):**
```
Tesla Model Y Performance, Ultra Red paint, front three-quarter, clean minimalist look, hero shot
```
**Галерея (2.jpg, 3.jpg):** glass roof from above; minimalist interior with centre screen

### Volkswagen Golf R
Папка: `public/images/prizes/volkswagen-golf-r/` · стиль: товар

**Обложка (cover.jpg):**
```
Volkswagen Golf R hot hatch, Lapiz Blue, front three-quarter, quad exhaust visible, hero shot
```
**Галерея (2.jpg, 3.jpg):** rear with four tailpipes; R steering wheel interior

### Ford Mustang GT Fastback
Папка: `public/images/prizes/ford-mustang-gt/` · стиль: товар

**Обложка (cover.jpg):**
```
Ford Mustang GT Fastback, Race Red with black stripes, aggressive low front angle, hero shot
```
**Галерея (2.jpg, 3.jpg):** V8 engine bay; six-speed manual shifter close-up

### MINI Cooper SE Electric
Папка: `public/images/prizes/mini-cooper-se/` · стиль: товар

**Обложка (cover.jpg):**
```
new MINI Cooper SE electric, Nanuq White with black roof, front three-quarter, round headlights, hero shot
```
**Галерея (2.jpg, 3.jpg):** round OLED centre display interior; side profile

### Range Rover Velar Dynamic HSE
Папка: `public/images/prizes/range-rover-velar/` · стиль: товар

**Обложка (cover.jpg):**
```
Range Rover Velar Dynamic HSE, Varesine Blue, sleek side three-quarter, flush door handles, hero shot
```
**Галерея (2.jpg, 3.jpg):** minimal cabin with twin touchscreens; rear lights detail

### Ducati Panigale V4 S
Папка: `public/images/prizes/ducati-panigale-v4-s/` · стиль: товар

**Обложка (cover.jpg):**
```
Ducati Panigale V4 S superbike in Ducati Red, side profile on a reflective floor, hero shot
```
**Галерея (2.jpg, 3.jpg):** Öhlins front fork and forged wheel detail; cockpit TFT display

### Vespa GTS 310 Super Sport
Папка: `public/images/prizes/vespa-gts-310/` · стиль: товар

**Обложка (cover.jpg):**
```
Vespa GTS 310 Super Sport scooter, matte green with two matching helmets beside it, hero shot
```
**Галерея (2.jpg, 3.jpg):** front shield and round headlight close-up; colour display

### BMW X5 M60i xDrive
Папка: `public/images/prizes/bmw-x5-m60i/` · стиль: товар

**Обложка (cover.jpg):**
```
BMW X5 M60i SUV, Carbon Black metallic, front three-quarter, illuminated kidney grille, hero shot
```
**Галерея (2.jpg, 3.jpg):** Sky Lounge panoramic roof at night; Bowers & Wilkins speaker grille

## Часы

### Rolex Cosmograph Daytona
Папка: `public/images/prizes/rolex-daytona-steel/` · стиль: товар

**Обложка (cover.jpg):**
```
Rolex Cosmograph Daytona in Oystersteel with white "panda" dial and black ceramic bezel, three-quarter angle on black velvet, hero shot
```
**Галерея (2.jpg, 3.jpg):** caseback-side profile; on the wrist in soft light

### Omega Seamaster Diver 300M
Папка: `public/images/prizes/omega-seamaster-diver-300m/` · стиль: товар

**Обложка (cover.jpg):**
```
Omega Seamaster Diver 300M, blue wave dial and blue ceramic bezel, water droplets on the crystal, hero shot
```
**Галерея (2.jpg, 3.jpg):** helium valve and crown detail; bracelet laid flat

### Tudor Black Bay Fifty-Eight
Папка: `public/images/prizes/tudor-black-bay-58/` · стиль: товар

**Обложка (cover.jpg):**
```
Tudor Black Bay Fifty-Eight, black dial with gilt markers and black bezel, vintage feel, on dark leather, hero shot
```
**Галерея (2.jpg, 3.jpg):** side profile showing 39 mm case; fabric strap variant

### TAG Heuer Carrera Chronograph
Папка: `public/images/prizes/tag-heuer-carrera-chronograph/` · стиль: товар

**Обложка (cover.jpg):**
```
TAG Heuer Carrera Chronograph with domed glassbox crystal and blue dial, racing-inspired, hero shot
```
**Галерея (2.jpg, 3.jpg):** dial macro showing sub-dials; caseback with Heuer 02 movement

### Cartier Santos de Cartier
Папка: `public/images/prizes/cartier-santos-medium/` · стиль: товар

**Обложка (cover.jpg):**
```
Cartier Santos de Cartier medium, steel square case with exposed screws, silver dial, hero shot
```
**Галерея (2.jpg, 3.jpg):** with leather strap swapped in; bracelet detail

### Breitling Navitimer B01 43
Папка: `public/images/prizes/breitling-navitimer-b01/` · стиль: товар

**Обложка (cover.jpg):**
```
Breitling Navitimer B01 43, black dial with slide-rule bezel, aviation mood, hero shot
```
**Галерея (2.jpg, 3.jpg):** bezel macro with slide-rule scale; on a vintage map

### Patek Philippe Aquanaut 5167A
Папка: `public/images/prizes/patek-philippe-aquanaut/` · стиль: товар

**Обложка (cover.jpg):**
```
Patek Philippe Aquanaut steel, embossed black dial, black tropical strap, lying on dark stone, hero shot
```
**Галерея (2.jpg, 3.jpg):** case profile; dial macro of the grenade texture

### Apple Watch Ultra 3
Папка: `public/images/prizes/apple-watch-ultra-3/` · стиль: товар

**Обложка (cover.jpg):**
```
Apple Watch Ultra 3 titanium case with orange Alpine Loop, display lit with a watch face, hero shot
```
**Галерея (2.jpg, 3.jpg):** side with Action button; on a climber's wrist in mountains

## Техника

### iPhone 17 Pro Max 1 TB
Папка: `public/images/prizes/iphone-17-pro-max/` · стиль: товар

**Обложка (cover.jpg):**
```
iPhone 17 Pro Max, back view showing triple camera plateau, standing at an angle, cosmic orange, hero shot
```
**Галерея (2.jpg, 3.jpg):** front display lit; three colour options in a row

### MacBook Pro 16-inch
Папка: `public/images/prizes/macbook-pro-16/` · стиль: товар

**Обложка (cover.jpg):**
```
MacBook Pro 16-inch, space black, open with a vivid display, on a dark desk, hero shot
```
**Галерея (2.jpg, 3.jpg):** closed lid top view; side ports detail

### PlayStation 5 Pro Ultimate Bundle
Папка: `public/images/prizes/playstation-5-pro-bundle/` · стиль: товар

**Обложка (cover.jpg):**
```
PlayStation 5 Pro console standing upright with PS VR2 headset and two DualSense Edge controllers, game boxes fanned out, hero shot
```
**Галерея (2.jpg, 3.jpg):** controller close-up; VR headset glowing

### Nintendo Switch 2 Mega Bundle
Папка: `public/images/prizes/nintendo-switch-2-bundle/` · стиль: товар

**Обложка (cover.jpg):**
```
Nintendo Switch 2 console with red and blue Joy-Con, Pro Controller and carry case, eight game boxes, hero shot
```
**Галерея (2.jpg, 3.jpg):** handheld mode screen lit; docked on a TV stand

### Ultimate Gaming PC (RTX 5090)
Папка: `public/images/prizes/gaming-pc-rtx-5090/` · стиль: товар

**Обложка (cover.jpg):**
```
custom water-cooled gaming PC with glass panel and RGB in violet tones, 32-inch curved OLED monitor, keyboard and headset on a desk, hero shot
```
**Галерея (2.jpg, 3.jpg):** inside the case showing graphics card; monitor showing a game scene

### Samsung 77" OLED Home Cinema
Папка: `public/images/prizes/samsung-77-oled-cinema/` · стиль: товар

**Обложка (cover.jpg):**
```
77-inch OLED TV wall-mounted in a dark living room, vivid image on screen, soundbar below, hero shot
```
**Галерея (2.jpg, 3.jpg):** ultra-thin TV edge; soundbar and subwoofer

### DJI Creator Kit
Папка: `public/images/prizes/dji-creator-kit/` · стиль: товар

**Обложка (cover.jpg):**
```
DJI Mini 4 Pro drone, Osmo Pocket 3 and Osmo Action 5 Pro laid out flat-lay style, hero shot
```
**Галерея (2.jpg, 3.jpg):** drone mid-flight over coast at sunset; pocket gimbal in hand

### iPad Pro 13" Studio Set
Папка: `public/images/prizes/ipad-pro-13-studio/` · стиль: товар

**Обложка (cover.jpg):**
```
iPad Pro 13-inch on Magic Keyboard with Apple Pencil Pro, display showing digital painting, hero shot
```
**Галерея (2.jpg, 3.jpg):** ultra-thin side profile; pencil drawing close-up

### Sony Noise-Cancelling Audio Bundle
Папка: `public/images/prizes/sony-audio-bundle/` · стиль: товар

**Обложка (cover.jpg):**
```
Sony WH-1000XM5 headphones in black, WF-1000XM5 earbuds in open case and a portable speaker, hero shot
```
**Галерея (2.jpg, 3.jpg):** headphones on a stand; earbuds macro

## Деньги

### €100,000 Tax-Free Cash
Папка: `public/images/prizes/cash-100000-mega/` · стиль: товар

**Обложка (cover.jpg):**
```
neat stacks of euro banknotes in a black briefcase, violet light, luxurious, hero shot
```
**Галерея (2.jpg, 3.jpg):** fan of €500-style notes (no real serials); gold confetti

### €25,000 Cash
Папка: `public/images/prizes/cash-25000/` · стиль: товар

**Обложка (cover.jpg):**
```
stacks of euro banknotes on a dark marble surface with soft violet rim light, hero shot
```
**Галерея (2.jpg, 3.jpg):** banknotes in an envelope

### €5,000 Weekly Cash
Папка: `public/images/prizes/cash-5000-weekly/` · стиль: товар

**Обложка (cover.jpg):**
```
euro banknotes fanned out with a calendar-week concept, clean studio, hero shot
```

### €1,000 Friday Cash
Папка: `public/images/prizes/cash-1000-friday/` · стиль: товар

**Обложка (cover.jpg):**
```
euro notes and coins with a glowing neon "Friday" mood, playful, night city bokeh, hero shot
```

### Your Rent Paid for a Year
Папка: `public/images/prizes/rent-paid-for-a-year/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
house keys on a ring next to euro banknotes on a doormat, cosy modern apartment entrance in background, hero shot
```
**Галерея (2.jpg, 3.jpg):** bright living room interior

### €20,000 Instant Win Frenzy
Папка: `public/images/prizes/cash-instant-win-20000/` · стиль: товар

**Обложка (cover.jpg):**
```
shower of euro banknotes and confetti bursting from a glowing violet ticket, energetic, hero shot
```

## Путешествия

### Luxury Week in Dubai for Two
Папка: `public/images/prizes/dubai-luxury-week/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
Dubai skyline with Burj Khalifa at dusk seen from an infinity pool on Palm Jumeirah, hero shot
```
**Галерея (2.jpg, 3.jpg):** desert dunes safari jeep at sunset; luxury suite bedroom

### Two Weeks in Japan for Two
Папка: `public/images/prizes/japan-two-weeks/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
Kyoto pagoda with cherry blossoms and Mount Fuji feel, golden hour, hero shot
```
**Галерея (2.jpg, 3.jpg):** Tokyo Shibuya at night in neon; ryokan with onsen

### Kenya Safari and Zanzibar Beach
Папка: `public/images/prizes/kenya-safari/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
luxury safari tent overlooking the Masai Mara savannah with elephants at sunrise, hero shot
```
**Галерея (2.jpg, 3.jpg):** Zanzibar white beach with dhow boat

### New York Shopping Trip
Папка: `public/images/prizes/new-york-shopping-trip/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
Manhattan skyline at blue hour from a rooftop, shopping bags in foreground, hero shot
```
**Галерея (2.jpg, 3.jpg):** Fifth Avenue store fronts; helicopter view of Central Park

### Santorini Cliff Villa
Папка: `public/images/prizes/santorini-villa/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
Santorini cave villa with private plunge pool overlooking the caldera at sunset, whitewashed walls, hero shot
```
**Галерея (2.jpg, 3.jpg):** catamaran at sea; blue dome church

### Ski Week in Courchevel
Папка: `public/images/prizes/courchevel-ski-chalet/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
luxury wooden ski chalet in snowy Alps at dusk, warm windows, hot tub steaming on terrace, hero shot
```
**Галерея (2.jpg, 3.jpg):** skis on a rack with mountain view; chalet lounge with fireplace

### Monaco Grand Prix Weekend
Папка: `public/images/prizes/monaco-grand-prix-weekend/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
Monaco harbour with yachts and the racetrack, Formula 1 style car blurred at speed (no team logos), hero shot
```
**Галерея (2.jpg, 3.jpg):** terrace view over the circuit; Monte Carlo casino square at night

### Iceland Northern Lights Escape
Папка: `public/images/prizes/iceland-northern-lights/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
glass-roof cabin in Iceland under green northern lights, snowy landscape, hero shot
```
**Галерея (2.jpg, 3.jpg):** Blue Lagoon steaming water; super-jeep on a glacier

## Дом

### €30,000 Home Makeover
Папка: `public/images/prizes/home-makeover-30000/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
modern designer kitchen with dark cabinetry, marble island and warm lighting, hero shot
```
**Галерея (2.jpg, 3.jpg):** spa-style bathroom with freestanding tub

### Dyson Complete Home Bundle
Папка: `public/images/prizes/dyson-home-bundle/` · стиль: товар

**Обложка (cover.jpg):**
```
Dyson cordless vacuum, Airwrap styler, Supersonic dryer and purifier fan arranged together in a studio, hero shot
```
**Галерея (2.jpg, 3.jpg):** Airwrap close-up with attachments

### Garden Hot Tub and Sauna
Папка: `public/images/prizes/garden-hot-tub/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
six-seat hot tub glowing on a wooden garden deck at night, steam rising, cedar barrel sauna beside it, hero shot
```
**Галерея (2.jpg, 3.jpg):** inside the barrel sauna

### La Marzocco Linea Mini Coffee Bar
Папка: `public/images/prizes/la-marzocco-linea-mini/` · стиль: товар

**Обложка (cover.jpg):**
```
La Marzocco Linea Mini espresso machine in white with matching grinder on a walnut counter, espresso pouring, hero shot
```
**Галерея (2.jpg, 3.jpg):** latte art close-up; bags of specialty beans

### Smart Home Gym
Папка: `public/images/prizes/home-gym-bundle/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
home gym room with smart spin bike, wooden water rower and adjustable dumbbells, morning light, hero shot
```
**Галерея (2.jpg, 3.jpg):** spin bike screen close-up

### Outdoor Kitchen and Pizza Oven
Папка: `public/images/prizes/outdoor-kitchen/` · стиль: место/интерьер

**Обложка (cover.jpg):**
```
stainless steel outdoor kitchen with gas grill and wood-fired pizza oven on a patio at golden hour, hero shot
```
**Галерея (2.jpg, 3.jpg):** pizza coming out of the oven

## Украшения и сумки

### 1 Carat Diamond Solitaire Ring
Папка: `public/images/prizes/diamond-solitaire-1ct/` · стиль: товар

**Обложка (cover.jpg):**
```
1 carat round brilliant diamond solitaire ring in platinum, in an open black velvet box, sparkling, hero shot
```
**Галерея (2.jpg, 3.jpg):** macro of the diamond facets

### Diamond Tennis Bracelet
Папка: `public/images/prizes/diamond-tennis-bracelet/` · стиль: товар

**Обложка (cover.jpg):**
```
diamond tennis bracelet in white gold draped over a black velvet bust, sparkling, hero shot
```
**Галерея (2.jpg, 3.jpg):** clasp detail; on a wrist

### Vintage Alhambra Necklace
Папка: `public/images/prizes/van-cleef-alhambra/` · стиль: товар

**Обложка (cover.jpg):**
```
gold four-leaf clover motif necklace with mother-of-pearl, laid in a gentle curve on dark silk, hero shot
```
**Галерея (2.jpg, 3.jpg):** single clover macro

### Cartier Juste un Clou Bracelet
Папка: `public/images/prizes/cartier-juste-un-clou/` · стиль: товар

**Обложка (cover.jpg):**
```
rose gold nail-shaped bracelet on dark marble, elegant, hero shot
```
**Галерея (2.jpg, 3.jpg):** on a wrist with soft light

### Designer Handbag Collection
Папка: `public/images/prizes/designer-handbag-collection/` · стиль: товар

**Обложка (cover.jpg):**
```
three luxury handbags — quilted black flap bag, monogram tote, structured lady bag — on a dark boutique shelf, hero shot
```
**Галерея (2.jpg, 3.jpg):** quilting and chain strap close-up
