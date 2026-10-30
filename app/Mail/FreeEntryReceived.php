<?php

namespace App\Mail;

use App\Models\FreeEntryRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Sent to the operator's free entry inbox. */
class FreeEntryReceived extends Mailable
{
    public function __construct(public FreeEntryRequest $entry) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Free entry request {$this->entry->reference} — {$this->entry->raffle->title}",
            replyTo: [$this->entry->email],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'mail.free-entry-received');
    }
}
