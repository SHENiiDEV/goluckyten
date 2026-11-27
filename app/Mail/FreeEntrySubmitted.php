<?php

namespace App\Mail;

use App\Models\FreeEntryRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Sends the player their free entry code and the letter template to post to us. */
class FreeEntrySubmitted extends Mailable
{
    public function __construct(public FreeEntryRequest $entry) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your free entry code {$this->entry->reference}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.free-entry-submitted');
    }
}
