<?php

namespace App\Mail;

use App\Models\FreeEntryRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class FreeEntryDecision extends Mailable
{
    public function __construct(public FreeEntryRequest $entry, public ?int $ticketNumber) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->ticketNumber
            ? "Your free ticket for {$this->entry->raffle->title}: #{$this->ticketNumber}"
            : "Your free entry request {$this->entry->reference}");
    }

    public function content(): Content
    {
        return new Content(view: 'mail.free-entry-decision');
    }
}
