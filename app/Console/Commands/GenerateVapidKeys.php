<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateVapidKeys extends Command
{
    protected $signature = 'push:vapid';

    protected $description = 'Generate a VAPID key pair for browser push notifications';

    public function handle(): int
    {
        $key = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
        $d = openssl_pkey_get_details($key)['ec'];
        $b64 = fn ($s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
        $pad = fn ($s) => str_pad($s, 32, "\0", STR_PAD_LEFT);

        $this->line('Add these to .env:');
        $this->newLine();
        $this->line('VAPID_PUBLIC_KEY='.$b64("\x04".$pad($d['x']).$pad($d['y'])));
        $this->line('VAPID_PRIVATE_KEY='.$b64($pad($d['d'])));

        return self::SUCCESS;
    }
}
