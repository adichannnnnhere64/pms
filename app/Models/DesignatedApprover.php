<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DesignatedApprover extends Model
{
    protected $fillable = [
        'user_id',
        'approval_type',
        'title',
        'order',
        'is_required',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_required' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Approval type constants
     */
    public const TYPE_APPROVER = 'approver';
    public const TYPE_RELEASER = 'releaser';

    /**
     * Get the user for this approver.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get active approvers only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get approvers by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('approval_type', $type);
    }

    /**
     * Check if a user is a designated approver.
     */
    public static function isDesignatedApprover(int $userId): bool
    {
        return static::active()
            ->ofType(self::TYPE_APPROVER)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Check if a user is a designated releaser.
     */
    public static function isDesignatedReleaser(int $userId): bool
    {
        return static::active()
            ->ofType(self::TYPE_RELEASER)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Get all active approvers ordered.
     */
    public static function getApprovers()
    {
        return static::active()
            ->ofType(self::TYPE_APPROVER)
            ->with('user')
            ->orderBy('order')
            ->get();
    }

    /**
     * Get all active releasers ordered.
     */
    public static function getReleasers()
    {
        return static::active()
            ->ofType(self::TYPE_RELEASER)
            ->with('user')
            ->orderBy('order')
            ->get();
    }

    /**
     * Scope to get required approvers only.
     */
    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    /**
     * Get all required approvers (active and required).
     */
    public static function getRequiredApprovers()
    {
        return static::active()
            ->required()
            ->ofType(self::TYPE_APPROVER)
            ->with('user')
            ->orderBy('order')
            ->get();
    }

    /**
     * Get all required releasers (active and required).
     */
    public static function getRequiredReleasers()
    {
        return static::active()
            ->required()
            ->ofType(self::TYPE_RELEASER)
            ->with('user')
            ->orderBy('order')
            ->get();
    }

    /**
     * Check if a user is a required approver.
     */
    public static function isRequiredApprover(int $userId): bool
    {
        return static::active()
            ->required()
            ->ofType(self::TYPE_APPROVER)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Check if a user is a required releaser.
     */
    public static function isRequiredReleaser(int $userId): bool
    {
        return static::active()
            ->required()
            ->ofType(self::TYPE_RELEASER)
            ->where('user_id', $userId)
            ->exists();
    }
}
