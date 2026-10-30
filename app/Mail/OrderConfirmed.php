<?php

namespace App\Mail;

use App\Models\Order;
use App\Services\InvoiceService;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class OrderConfirmed extends Mailable
{
    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your GoLuckyTen tickets: order {$this->order->reference}");
    }

    public function content(): Content
    {
        $this->order->loadMissing(['items.raffle', 'tickets', 'user']);
        $wins = \App\Models\InstantWinPrize::whereIn('ticket_id', $this->order->tickets->pluck('id'))->get();

        return new Content(view: 'mail.order-confirmed', with: [
            'byRaffle' => $this->order->tickets->groupBy('raffle_id'),
            'wins' => $wins,
        ]);
    }

    public function attachments(): array
    {
        $invoices = app(InvoiceService::class);
        $pdf = $invoices->pdf($this->order);

        return [
            $pdf !== null
                ? Attachment::fromData(fn () => $pdf, $invoices->filename($this->order))->withMime('application/pdf')
                : Attachment::fromData(fn () => $invoices->html($this->order), str_replace('.pdf', '.html', $invoices->filename($this->order)))->withMime('text/html'),
        ];
    }
}
