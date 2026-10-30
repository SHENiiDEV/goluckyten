<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    /** Sequential per year: LT-2026-000123. Called inside the checkout transaction. */
    public function nextNumber(): string
    {
        $prefix = config('company.invoice_prefix').'-'.now()->year.'-';
        $last = DB::table('orders')->where('invoice_number', 'like', $prefix.'%')->lockForUpdate()->max('invoice_number');
        $n = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $n, 6, '0', STR_PAD_LEFT);
    }

    public function html(Order $order): string
    {
        $order->loadMissing(['items.raffle', 'user', 'promoCode']);
        $vatRate = (float) config('company.vat_rate');
        $vat = $vatRate > 0 ? (int) round($order->total_cents - $order->total_cents / (1 + $vatRate / 100)) : 0;

        $logo = public_path('images/brand/logo-black-h160.png');

        return view('invoices.order', [
            'order' => $order,
            'vatRate' => $vatRate,
            'vatCents' => $vat,
            'logo' => is_file($logo) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logo)) : null,
        ])->render();
    }

    public static function pdfAvailable(): bool
    {
        return class_exists(\Dompdf\Dompdf::class);
    }

    /** PDF bytes, or null when dompdf isn't installed (callers fall back to HTML). */
    public function pdf(Order $order): ?string
    {
        if (! self::pdfAvailable()) {
            return null;
        }
        $dompdf = new \Dompdf\Dompdf(['isRemoteEnabled' => false, 'defaultFont' => 'Helvetica']);
        $dompdf->loadHtml($this->html($order));
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }

    public function filename(Order $order): string
    {
        return 'GoLuckyTen-invoice-'.($order->invoice_number ?? $order->reference).'.pdf';
    }
}
