<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['promo_code_id', 'user_id', 'order_id', 'discount_cents'])]
class PromoRedemption extends Model {}
