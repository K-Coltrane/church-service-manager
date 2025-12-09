<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'inviter_name',
    ];

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'attendance')
                    ->withPivot('checked_in_at')
                    ->withTimestamps();
    }

    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}
