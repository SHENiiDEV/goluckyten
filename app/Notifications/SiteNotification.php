<?php

namespace App\Notifications;

use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * One notification type for everything players see in the bell, as push, and optionally by email.
 */
class SiteNotification extends Notification
{
    public function __construct(
        public string $title,
        public string $body,
        public ?string $url = null,
        public bool $email = false,
        public string $kind = 'info',
    ) {}

    public function via(object $notifiable): array
    {
        return array_values(array_filter(['database', WebPushChannel::class, $this->email ? 'mail' : null]));
    }

    public function toArray(object $notifiable): array
    {
        return ['title' => $this->title, 'body' => $this->body, 'url' => $this->url, 'kind' => $this->kind];
    }

    public function toWebPush(object $notifiable): array
    {
        return ['title' => $this->title, 'body' => $this->body, 'url' => $this->url ?? '/', 'icon' => '/images/brand/icon-192.png'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title)
            ->view('mail.notification', ['title' => $this->title, 'body' => $this->body, 'url' => $this->url ? url($this->url) : null, 'name' => $notifiable->name]);
    }
}
