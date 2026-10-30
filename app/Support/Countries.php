<?php

namespace App\Support;

class Countries
{
    /** Countries players may register from: code => name, sorted by name. */
    public static function allowed(): array
    {
        $restricted = array_flip(config('countries.restricted'));

        return array_diff_key(config('countries.all'), $restricted);
    }

    /** List for <select> on the frontend. */
    public static function options(): array
    {
        $out = [];
        foreach (self::allowed() as $code => $name) {
            $out[] = ['code' => $code, 'name' => $name];
        }

        return $out;
    }

    public static function isAllowed(?string $code): bool
    {
        return $code !== null && array_key_exists($code, self::allowed());
    }
}
