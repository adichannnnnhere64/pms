<?php

return [
    /*
    |--------------------------------------------------------------------------
    | RAF (Request for Approval Form) Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains all configurable values for the RAF form and PDF.
    | Modify these values to customize your RAF output.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Company Information
    |--------------------------------------------------------------------------
    */
    'company' => [
        'name' => env('RAF_COMPANY_NAME', 'Fintechss'),
        'address' => env('RAF_COMPANY_ADDRESS', 'Basqjwkelcqwe'),
        'phone' => env('RAF_COMPANY_PHONE', '+1 234 567 8900'),
        'email' => env('RAF_COMPANY_EMAIL', 'info@yahoo.com'),
        'logo' => env('RAF_COMPANY_LOGO', null), // Path relative to public/
    ],

    /*
    |--------------------------------------------------------------------------
    | PDF Settings
    |--------------------------------------------------------------------------
    */
    'pdf' => [
        'paper_size' => 'A4',
        'orientation' => 'portrait',
        'title' => 'Request for Approval Form',
        'filename_prefix' => 'RAF',
        'show_logo' => true,
        'show_footer' => true,
        'footer_text' => 'This is a computer-generated document. No signature required.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    */
    'currency' => [
        'code' => 'PHP',
        'symbol' => '₱',
        'position' => 'before', // 'before' or 'after'
        'decimal_separator' => '.',
        'thousands_separator' => ',',
        'decimals' => 2,
    ],

    /*
    |--------------------------------------------------------------------------
    | Date Format
    |--------------------------------------------------------------------------
    */
    'date_format' => 'F d, Y', // e.g., "January 01, 2026"
    'datetime_format' => 'F d, Y h:i A', // e.g., "January 01, 2026 10:30 AM"

    /*
    |--------------------------------------------------------------------------
    | Status Labels
    |--------------------------------------------------------------------------
    */
    'statuses' => [
        'draft' => [
            'label' => 'Pending',
            'color' => '#6B7280', // gray
        ],
        'pending_approval' => [
            'label' => 'Pending Approval',
            'color' => '#F59E0B', // yellow/amber
        ],
        'approved' => [
            'label' => 'Approved',
            'color' => '#10B981', // green
        ],
        'rejected' => [
            'label' => 'Rejected',
            'color' => '#EF4444', // red
        ],
        'completed' => [
            'label' => 'Completed',
            'color' => '#3B82F6', // blue
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Department Options
    |--------------------------------------------------------------------------
    */
    'departments' => [
        'Operations',
        'Finance',
        'Human Resources',
        'Marketing',
        'IT',
        'Sales',
        'Administration',
    ],

    /*
    |--------------------------------------------------------------------------
    | Particular Options
    |--------------------------------------------------------------------------
    */
    'particulars' => [
        'safety_equipments' => 'Safety Equipments',
        'payroll' => 'Payroll',
        'bonus' => 'Bonus',
        'repairs' => 'Repairs',
    ],

    /*
    |--------------------------------------------------------------------------
    | Category Options
    |--------------------------------------------------------------------------
    */
    'categories' => [
        'office_supplies' => 'Office Supplies',
        'furniture' => 'Furniture',
        'equipment' => 'Equipment',
        'software' => 'Software',
        'services' => 'Services',
        'travel' => 'Travel',
        'utilities' => 'Utilities',
        'other' => 'Other',
    ],

    /*
    |--------------------------------------------------------------------------
    | Approval Thresholds (optional)
    |--------------------------------------------------------------------------
    | Set amount thresholds that may require different approval levels.
    */
    'approval_thresholds' => [
        'manager' => 50000,    // Up to this amount, manager can approve
        'director' => 200000, // Up to this amount, director must approve
        // Above director threshold requires executive approval
    ],

    /*
    |--------------------------------------------------------------------------
    | PDF Signature Lines
    |--------------------------------------------------------------------------
    */
    'signatures' => [
        'prepared_by' => [
            'label' => 'Prepared By',
            'show' => true,
        ],
        'approved_by' => [
            'label' => 'Approved By',
            'show' => true,
        ],
        'released_by' => [
            'label' => 'Released By',
            'show' => true,
        ],
    ],
];
