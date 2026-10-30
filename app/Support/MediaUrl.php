<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

class MediaUrl
{
    /**
     * Paths starting with "/" or "http" are served as-is (e.g. files you drop into public/images),
     * everything else is an upload on the public disk.
     */
    public static function to(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, '/') || str_starts_with($path, 'http')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
