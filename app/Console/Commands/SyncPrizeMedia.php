<?php

namespace App\Console\Commands;

use App\Models\Raffle;
use Illuminate\Console\Command;

/**
 * Picks up images/videos you drop into public/ and attaches them to raffles by slug:
 *
 *   public/images/prizes/{slug}/cover.(jpg|webp|png)   -> main image
 *   public/images/prizes/{slug}/2.jpg, 3.jpg, ...       -> gallery
 *   public/videos/prizes/{slug}.mp4                     -> video
 */
class SyncPrizeMedia extends Command
{
    protected $signature = 'raffles:sync-media {--force : Overwrite media that was uploaded in the admin}';

    protected $description = 'Attach images and videos from public/images/prizes and public/videos/prizes to raffles';

    public function handle(): int
    {
        $updated = 0;

        foreach (Raffle::all() as $raffle) {
            $dir = public_path("images/prizes/{$raffle->slug}");
            $changes = [];

            if (is_dir($dir)) {
                $files = collect(scandir($dir))
                    ->filter(fn ($f) => preg_match('/\.(jpe?g|png|webp|avif)$/i', $f))
                    ->sort(SORT_NATURAL)->values();

                $cover = $files->first(fn ($f) => str_starts_with(strtolower($f), 'cover.')) ?? $files->first();
                if ($cover && ($this->option('force') || ! $raffle->image_path || ! self::isUpload($raffle->image_path))) {
                    $changes['image_path'] = "/images/prizes/{$raffle->slug}/{$cover}";
                }

                $gallery = $files->reject(fn ($f) => $f === $cover)->map(fn ($f) => "/images/prizes/{$raffle->slug}/{$f}")->values()->all();
                $keepUploads = collect($raffle->gallery ?? [])->filter(fn ($p) => self::isUpload($p))->all();
                if ($gallery || $cover) {
                    $changes['gallery'] = $this->option('force') ? $gallery : array_values([...$gallery, ...$keepUploads]);
                }
            }

            foreach (['mp4', 'webm'] as $ext) {
                if (file_exists(public_path("videos/prizes/{$raffle->slug}.{$ext}"))
                    && ($this->option('force') || ! $raffle->video_path || ! self::isUpload($raffle->video_path))) {
                    $changes['video_path'] = "/videos/prizes/{$raffle->slug}.{$ext}";
                    break;
                }
            }

            if ($changes) {
                $raffle->update($changes);
                $updated++;
                $this->line("  {$raffle->slug}: ".implode(', ', array_keys(array_filter($changes))));
            }
        }

        $this->info("Updated {$updated} raffle(s).");

        return self::SUCCESS;
    }

    /** Files uploaded through the admin live on the public disk (relative paths). */
    private static function isUpload(string $path): bool
    {
        return ! str_starts_with($path, '/') && ! str_starts_with($path, 'http');
    }
}
