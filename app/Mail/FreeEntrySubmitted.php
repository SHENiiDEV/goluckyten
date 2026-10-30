<?php

namespace App\Mail;

use App\Models\FreeEntryRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Confirmation to the player that their request arrived. */
class FreeEntrySubmitted extends Mailable
{
    public function __construct(public FreeEntryRequest $entry) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "We received your free entry request ({$this->entry->reference})");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.free-entry-submitted');
    }
}
