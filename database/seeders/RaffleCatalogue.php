<?php

namespace Database\Seeders;

use App\Models\InstantWinPrize as P;
use App\Models\Raffle;

/**
 * Demo catalogue. Prize images/videos are picked up from
 * public/images/prizes/{slug}/ and public/videos/prizes/{slug}.mp4 (see docs/MEDIA-PROMPTS.md).
 */
class RaffleCatalogue
{
    public static function raffles(): array
    {
        $d = fn (int $days, int $hour = 20) => now()->addDays($days)->setTime($hour, 0);
        $cash = P::TYPE_CASH;
        $item = P::TYPE_ITEM;
        // Demo photos from Unsplash (free licence, hot-linked). Replace with real photos of your actual prizes
        // by dropping files into public/images/prizes/{slug}/ and running `php artisan raffles:sync-media`.
        $u = fn (string $id, int $w = 1600) => "https://images.unsplash.com/{$id}?auto=format&fit=crop&w={$w}&q=80";
        $cashImg = $u('photo-1573336939501-8eb3fc268258', 400);

        return [
            [
                'slug' => 'porsche-911-carrera-s', 'image_path' => $u('photo-1614162692292-7ac56d7f7f1e'), 'gallery' => [$u('photo-1580274455191-1c62238fa333'), $u('photo-1611651338412-8403fa6e3599'), $u('photo-1760288556040-6cdf3ab6c900')], 'promo_label' => 'Jackpot', 'headline' => 'Win a Porsche 911 for €0.10',
                 'brand' => 'Porsche', 'title' => 'Porsche 911 Carrera S',
                'subtitle' => '480 hp, 0–100 km/h in 3.5 s. Brand new, any colour you like.',
                'description' => "The benchmark sports car, ordered new from the factory to the winner's specification: choose the colour, interior and wheels.\n\nRegistered, insured for the first year and delivered to your door anywhere in the EU. Prefer cash? Take €140,000 instead.",
                'highlights' => ['Factory order to your spec', 'First-year insurance included', 'Door-to-door delivery in the EU', 'Or €140,000 tax-free cash'],
                'category' => 'cars', 'retail_value_cents' => 16500000, 'cash_alternative_cents' => 14000000,
                'ticket_price_cents' => 1999, 'max_tickets' => 14999, 'max_per_user' => 250, 'featured' => true,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(12),
                '_instant' => [
                    ['€5,000 cash', $cash, 500000, 1, $cashImg],
                    ['€1,000 cash', $cash, 100000, 5, $cashImg],
                    ['€100 cash', $cash, 10000, 25, $cashImg],
                    ['Apple AirPods Pro', $item, 27900, 5, $u('photo-1606741965326-cb990ae01bb2', 400)],
                ],
            ],
            [
                'slug' => 'rolex-submariner-date', 'image_path' => $u('photo-1526045431048-f857369baa09'), 'gallery' => [$u('photo-1662384197911-e82189f4dc60'), $u('photo-1662384205880-2c7a9879cc0c'), $u('photo-1640416822842-1d1cd0c6b9f1')], 'promo_label' => null, 'headline' => 'A Rolex Submariner for €0.10',
                 'brand' => 'Rolex', 'title' => 'Rolex Submariner Date',
                'subtitle' => '41 mm Oystersteel, black Cerachrom bezel. Unworn, full set.',
                'description' => "The diver's watch everyone recognises, in 41 mm Oystersteel with a black dial and ceramic bezel. Supplied unworn with box, papers and the five-year international warranty.\n\nShipped insured and signed-for, or take the cash alternative.",
                'highlights' => ['Unworn, full set', '5-year international warranty', 'Insured, signed-for delivery', 'Or €13,000 cash'],
                'category' => 'watches', 'retail_value_cents' => 1590000, 'cash_alternative_cents' => 1300000,
                'ticket_price_cents' => 399, 'max_tickets' => 7999, 'max_per_user' => 200,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(3),
                '_instant' => [
                    ['€250 cash', $cash, 25000, 2, $cashImg],
                    ['€50 cash', $cash, 5000, 10, $cashImg],
                ],
            ],
            [
                'slug' => 'instant-win-cash-50000', 'image_path' => $u('photo-1621280336935-ed7cae618aac'), 'gallery' => [$u('photo-1573336939501-8eb3fc268258'), $u('photo-1621981386829-9b458a2cddde')], 'promo_label' => 'Instant win', 'headline' => '€50,000 instant cash from €0.10',
                 'brand' => null, 'title' => '€50,000 Instant Win Cash',
                'subtitle' => '375 instant cash prizes, plus €10,000 in the final draw.',
                'description' => "Every ticket is checked the moment you buy it. Land on one of 375 winning numbers and the cash is yours straight away — from €20 up to €5,000.\n\nAll tickets, winning or not, also go into the final draw for €10,000.",
                'highlights' => ['375 instant wins', 'Instant wins paid within 24 hours', '€10,000 final draw', 'From €0.10 a ticket'],
                'category' => 'cash', 'retail_value_cents' => 1000000, 'cash_alternative_cents' => null,
                'ticket_price_cents' => 199, 'max_tickets' => 29999, 'max_per_user' => 500,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(1, 21), '_fill' => 0.55,
                '_instant' => [
                    ['€5,000 cash', $cash, 500000, 1, $cashImg],
                    ['€2,500 cash', $cash, 250000, 4, $cashImg],
                    ['€500 cash', $cash, 50000, 20, $cashImg],
                    ['€100 cash', $cash, 10000, 100, $cashImg],
                    ['€20 cash', $cash, 2000, 250, $cashImg],
                ],
            ],
            [
                'slug' => 'range-rover-sport', 'image_path' => $u('photo-1679506640590-f0152786dff0'), 'gallery' => [$u('photo-1602013871952-8379f19a15f1'), $u('photo-1638686302275-0e87df720aca'), $u('photo-1679506640605-acaa4c7d46ed')], 'promo_label' => null, 'headline' => 'Range Rover Sport or €120,000',
                 'brand' => 'Range Rover', 'title' => 'Range Rover Sport Autobiography',
                'subtitle' => 'P550e plug-in hybrid, 550 hp. Or €120,000 cash.',
                'description' => "The Range Rover Sport Autobiography in plug-in hybrid form: 550 hp, around 110 km of electric range and a cabin finished in semi-aniline leather.\n\nDelivered new with first-year insurance, or take the cash alternative.",
                'highlights' => ['Brand new, 0 km', 'Plug-in hybrid, 550 hp', 'First-year insurance', 'Or €120,000 cash'],
                'category' => 'cars', 'retail_value_cents' => 14500000, 'cash_alternative_cents' => 12000000,
                'ticket_price_cents' => 1499, 'max_tickets' => 12999, 'max_per_user' => 250,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(18),
                '_instant' => [
                    ['€2,500 cash', $cash, 250000, 2, $cashImg],
                    ['€250 cash', $cash, 25000, 10, $cashImg],
                    ['PlayStation 5 Pro', $item, 79900, 3, $u('photo-1622297845775-5ff3fef71d13', 400)],
                ],
            ],
            [
                'slug' => 'audemars-piguet-royal-oak', 'image_path' => $u('photo-1638872726444-0579101a60e7'), 'gallery' => [$u('photo-1636289026470-cb40ece1ebc3'), $u('photo-1695921504311-a42b163ae0a3')], 'promo_label' => 'Low odds', 'headline' => 'Royal Oak for €0.10',
                 'brand' => 'Audemars Piguet', 'title' => 'Audemars Piguet Royal Oak 41',
                'subtitle' => 'Ref. 15510ST, blue Grande Tapisserie dial.',
                'description' => "The octagonal-bezel icon in 41 mm stainless steel with the blue Grande Tapisserie dial and integrated bracelet. Unworn, with box and papers.\n\nOne of the hardest watches in the world to buy at retail — here from €0.10.",
                'highlights' => ['Unworn, box and papers', 'Authenticated before dispatch', 'Insured delivery', 'Or €60,000 cash'],
                'category' => 'watches', 'retail_value_cents' => 7200000, 'cash_alternative_cents' => 6000000,
                'ticket_price_cents' => 999, 'max_tickets' => 9999, 'max_per_user' => 250,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(7),
                '_instant' => [
                    ['€1,000 cash', $cash, 100000, 3, $cashImg],
                    ['€100 cash', $cash, 10000, 15, $cashImg],
                ],
            ],
            [
                'slug' => 'mercedes-amg-g63', 'image_path' => $u('photo-1648413653877-ade5eefd2f1b'), 'gallery' => [$u('photo-1654618345032-e3f3909750a8'), $u('photo-1610192804837-fb021b82b54c')], 'promo_label' => 'Biggest prize', 'headline' => 'The G 63 or €200,000 cash',
                 'brand' => 'Mercedes-AMG', 'title' => 'Mercedes-AMG G 63',
                'subtitle' => '585 hp twin-turbo V8. The ultimate G.',
                'description' => "The G-Class in its most extreme form: a hand-built 4.0-litre twin-turbo V8, three locking differentials and an interior to match.\n\nDelivered new and insured for the first year, or take €200,000 instead.",
                'highlights' => ['Brand new, 0 km', '585 hp V8', 'First-year insurance', 'Or €200,000 cash'],
                'category' => 'cars', 'retail_value_cents' => 23500000, 'cash_alternative_cents' => 20000000,
                'ticket_price_cents' => 2499, 'max_tickets' => 14999, 'max_per_user' => 250,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(25),
                '_instant' => [
                    ['€10,000 cash', $cash, 1000000, 1, $cashImg],
                    ['€500 cash', $cash, 50000, 10, $cashImg],
                ],
            ],
            [
                'slug' => 'apple-ultimate-bundle', 'image_path' => $u('photo-1576103200868-2dd3eec3f333'), 'gallery' => [$u('photo-1514826786317-59744fe2a548'), $u('photo-1759588073186-1d4ac7e33623')], 'promo_label' => '10c tickets', 'headline' => 'Four Apple flagships for 10c',
                 'brand' => 'Apple', 'title' => 'The ultimate Apple bundle',
                'subtitle' => 'iPhone 17 Pro Max, MacBook Pro 16″, iPad Pro and Apple Watch Ultra 3.',
                'description' => "Everything Apple makes at the top of the range: iPhone 17 Pro Max 1 TB, MacBook Pro 16-inch with M5 Max, iPad Pro 13-inch with Magic Keyboard and Apple Watch Ultra 3.\n\nAll brand new and sealed, with full warranty.",
                'highlights' => ['Four devices, all sealed', 'Full Apple warranty', 'Free express delivery'],
                'category' => 'tech', 'retail_value_cents' => 980000, 'cash_alternative_cents' => 800000,
                'ticket_price_cents' => 99, 'max_tickets' => 19999, 'max_per_user' => 500,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(5),
                '_instant' => [
                    ['Apple Watch Ultra 3', $item, 89900, 3, $u('photo-1549482199-bc1ca6f58502', 400)],
                    ['€50 cash', $cash, 5000, 20, $cashImg],
                ],
            ],
            [
                'slug' => 'cartier-love-bracelet', 'image_path' => $u('photo-1602173574767-37ac01994b2a'), 'gallery' => [$u('photo-1777999802051-f6f0296e76af')], 'promo_label' => null, 'headline' => null,
                 'brand' => 'Cartier', 'title' => 'Cartier Love bracelet',
                'subtitle' => '18k yellow gold, with screwdriver and certificate.',
                'description' => "Cartier's signature bracelet in 18k yellow gold, sized to the winner's wrist and supplied with its screwdriver, box and certificate.",
                'highlights' => ['Sized to your wrist', 'Box and certificate', 'Or €6,000 cash'],
                'category' => 'jewellery', 'retail_value_cents' => 770000, 'cash_alternative_cents' => 600000,
                'ticket_price_cents' => 149, 'max_tickets' => 7999, 'max_per_user' => 200,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(10),
            ],
            [
                'slug' => 'maldives-overwater-villa', 'image_path' => $u('photo-1758717152007-6a2eb7299409'), 'gallery' => [$u('photo-1743356174397-d6da6f014f8f'), $u('photo-1601999705946-fbf42c3c6c66')], 'promo_label' => null, 'headline' => 'Seven nights in the Maldives',
                 'brand' => null, 'title' => 'Seven nights in a Maldives overwater villa',
                'subtitle' => 'For two, with business-class flights and full board.',
                'description' => "Seven nights in a private overwater villa with its own pool, return business-class flights for two from any EU capital, seaplane transfers and full board.",
                'highlights' => ['Business-class flights for two', 'Private pool villa', 'Seaplane transfers', 'Travel within 12 months'],
                'category' => 'travel', 'retail_value_cents' => 1800000, 'cash_alternative_cents' => 1400000,
                'ticket_price_cents' => 299, 'max_tickets' => 8000, 'max_per_user' => 150,
                'status' => Raffle::STATUS_LIVE, 'draws_at' => $d(14),
            ],
            [
                'slug' => 'bmw-m4-competition', 'image_path' => $u('photo-1617531653332-bd46c24f2068'), 'gallery' => [], 'promo_label' => null, 'headline' => null,
                 'brand' => 'BMW', 'title' => 'BMW M4 Competition',
                'subtitle' => '530 hp, xDrive.',
                'description' => 'A brand-new BMW M4 Competition xDrive coupé.',
                'highlights' => ['Brand new', 'First-year insurance'],
                'category' => 'cars', 'retail_value_cents' => 11000000, 'cash_alternative_cents' => 9000000,
                'ticket_price_cents' => 999, 'max_tickets' => 9999, 'max_per_user' => 250,
                'status' => Raffle::STATUS_DRAWN, 'draws_at' => now()->subDays(6)->setTime(20, 0), '_fill' => 0.92,
            ],
            [
                'slug' => 'omega-speedmaster-moonwatch', 'image_path' => $u('photo-1556453007-ee036169934b'), 'gallery' => [], 'promo_label' => null, 'headline' => null,
                 'brand' => 'Omega', 'title' => 'Omega Speedmaster Moonwatch',
                'subtitle' => 'Co-Axial Master Chronometer, 42 mm.',
                'description' => 'The Moonwatch, unworn with box and papers.',
                'highlights' => ['Unworn', 'Full set'],
                'category' => 'watches', 'retail_value_cents' => 800000, 'cash_alternative_cents' => 650000,
                'ticket_price_cents' => 249, 'max_tickets' => 5999, 'max_per_user' => 150,
                'status' => Raffle::STATUS_DRAWN, 'draws_at' => now()->subDays(13)->setTime(20, 0), '_fill' => 0.97,
            ],
            [
                'slug' => 'cash-10000-september', 'image_path' => $u('photo-1579170053380-58064b2dee67'), 'gallery' => [], 'promo_label' => null, 'headline' => null,
                 'brand' => null, 'title' => '€10,000 cash',
                'subtitle' => 'September cash draw.',
                'description' => 'Ten thousand euros paid by bank transfer.',
                'highlights' => ['Paid within 48 hours'],
                'category' => 'cash', 'retail_value_cents' => 1000000, 'cash_alternative_cents' => null,
                'ticket_price_cents' => 99, 'max_tickets' => 15000, 'max_per_user' => 500,
                'status' => Raffle::STATUS_DRAWN, 'draws_at' => now()->subDays(27)->setTime(20, 0), '_fill' => 0.88,
            ],
        ];
    }
}
