<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\AccountabilityPaymentVoucher;
use App\Models\AccountPayableVoucherParticular;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $this->getFilters($request);
        $canViewCharts = $request->user()?->hasAnyRole(['manager', 'supervisor']) ?? false;

        return Inertia::render('dashboard', [
            'summaryStats' => $this->getSummaryStats($filters),
            'statusDistribution' => $canViewCharts ? $this->getStatusDistribution($filters) : [],
            'monthlyTrends' => $canViewCharts ? $this->getMonthlyTrends($filters) : [],
            'categorySpending' => $canViewCharts ? $this->getCategorySpending($filters) : [],
            'departmentSpending' => $canViewCharts ? $this->getDepartmentSpending($filters) : [],
            'departments' => Department::orderBy('name')->pluck('name')->toArray(),
            'filters' => $filters,
            'canViewCharts' => $canViewCharts,
        ]);
    }

    private function getFilters(Request $request): array
    {
        $department = $request->string('department')->toString();
        $status = $request->string('status')->toString();

        return [
            'department' => $department && $department !== 'all' ? $department : null,
            'status' => $status && $status !== 'all' ? $status : null,
            'start_date' => $request->string('start_date')->toString() ?: null,
            'end_date' => $request->string('end_date')->toString() ?: null,
        ];
    }

    private function applyFilters($query, array $filters, bool $applyStatus = true): void
    {
        if (!empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        if ($applyStatus && !empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
    }

    private function getSummaryStats(array $filters): array
    {
        $totalApvsQuery = AccountabilityPaymentVoucher::query();
        $this->applyFilters($totalApvsQuery, $filters);

        $pendingApprovalQuery = AccountabilityPaymentVoucher::query()
            ->whereIn('status', ['draft', 'pending_approval']);
        $this->applyFilters($pendingApprovalQuery, $filters, false);

        $totalApprovedQuery = AccountabilityPaymentVoucher::query()
            ->whereIn('status', ['approved', 'completed']);
        $this->applyFilters($totalApprovedQuery, $filters, false);

        $totalAmount = 0.0;
        if (empty($filters['status']) || $filters['status'] === 'completed') {
            $totalAmountQuery = AccountabilityPaymentVoucher::query()
                ->where('status', 'completed');
            $this->applyFilters($totalAmountQuery, $filters, false);
            $totalAmount = (float) $totalAmountQuery->sum('total_amount');
        }

        $pendingAmountQuery = AccountabilityPaymentVoucher::query()
            ->where('status', 'pending_approval');
        $this->applyFilters($pendingAmountQuery, $filters, false);

        return [
            'totalApvs' => $totalApvsQuery->count(),
            'pendingApproval' => $pendingApprovalQuery->count(),
            'totalApproved' => $totalApprovedQuery->count(),
            'totalAmount' => $totalAmount,
            'pendingAmount' => (float) $pendingAmountQuery->sum('total_amount'),
        ];
    }

    private function getStatusDistribution(array $filters): array
    {
        $statusesQuery = AccountabilityPaymentVoucher::select('status', DB::raw('COUNT(*) as count'));
        $this->applyFilters($statusesQuery, $filters);
        $statuses = $statusesQuery->groupBy('status')->get()->keyBy('status');

        $statusLabels = [
            'draft' => 'Pending',
            'pending_approval' => 'Pending Approval',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'completed' => 'Completed',
        ];

        $colors = [
            'draft' => '#94a3b8',
            'pending_approval' => '#fbbf24',
            'approved' => '#22c55e',
            'rejected' => '#ef4444',
            'completed' => '#3b82f6',
        ];

        return collect($statusLabels)->map(function ($label, $status) use ($statuses, $colors) {
            return [
                'name' => $label,
                'value' => $statuses->get($status)?->count ?? 0,
                'color' => $colors[$status],
            ];
        })->values()->toArray();
    }

    private function getMonthlyTrends(array $filters): array
    {
        if (!empty($filters['status']) && $filters['status'] !== 'completed') {
            return [];
        }

        $startDate = $filters['start_date']
            ? \Carbon\Carbon::parse($filters['start_date'])->startOfMonth()
            : now()->subMonths(5)->startOfMonth();
        $endDate = $filters['end_date']
            ? \Carbon\Carbon::parse($filters['end_date'])->startOfMonth()
            : now()->startOfMonth();

        $months = collect();
        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $months->push($cursor->format('Y-m'));
            $cursor->addMonth();
        }

        $apvsByMonth = AccountabilityPaymentVoucher::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(total_amount) as total')
        )
            ->where('status', 'completed')
            ->when(!empty($filters['department']), function ($query) use ($filters) {
                $query->where('department', $filters['department']);
            })
            ->when(!empty($filters['start_date']), function ($query) use ($filters) {
                $query->whereDate('created_at', '>=', $filters['start_date']);
            })
            ->when(!empty($filters['end_date']), function ($query) use ($filters) {
                $query->whereDate('created_at', '<=', $filters['end_date']);
            })
            ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
            ->get()
            ->keyBy('month');

        return $months->map(function ($month) use ($apvsByMonth) {
            $data = $apvsByMonth->get($month);
            return [
                'month' => \Carbon\Carbon::parse($month . '-01')->format('M'),
                'count' => $data?->count ?? 0,
                'amount' => (float) ($data?->total ?? 0),
            ];
        })->toArray();
    }

    private function getCategorySpending(array $filters): array
    {
        if (!empty($filters['status']) && $filters['status'] !== 'completed') {
            return [];
        }

        $categories = AccountPayableVoucherParticular::select(
            'category',
            DB::raw('SUM(amount) as total'),
            DB::raw('COUNT(*) as count')
        )
            ->whereHas('apv', function ($query) {
                $query->where('status', 'completed');
            })
            ->when(!empty($filters['department']), function ($query) use ($filters) {
                $query->whereHas('apv', function ($apvQuery) use ($filters) {
                    $apvQuery->where('department', $filters['department']);
                });
            })
            ->when(!empty($filters['start_date']), function ($query) use ($filters) {
                $query->whereHas('apv', function ($apvQuery) use ($filters) {
                    $apvQuery->whereDate('created_at', '>=', $filters['start_date']);
                });
            })
            ->when(!empty($filters['end_date']), function ($query) use ($filters) {
                $query->whereHas('apv', function ($apvQuery) use ($filters) {
                    $apvQuery->whereDate('created_at', '<=', $filters['end_date']);
                });
            })
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        $categoryLabels = [
            'office_supplies' => 'Office Supplies',
            'furniture' => 'Furniture',
            'equipment' => 'Equipment',
            'software' => 'Software',
            'services' => 'Services',
            'travel' => 'Travel',
            'utilities' => 'Utilities',
            'other' => 'Other',
        ];

        return $categories->map(function ($item) use ($categoryLabels) {
            return [
                'category' => $categoryLabels[$item->category] ?? ucfirst($item->category),
                'amount' => (float) $item->total,
                'count' => $item->count,
            ];
        })->toArray();
    }

    private function getDepartmentSpending(array $filters): array
    {
        if (!empty($filters['status']) && $filters['status'] !== 'completed') {
            return [];
        }

        return AccountabilityPaymentVoucher::select(
            'department',
            DB::raw('SUM(total_amount) as total'),
            DB::raw('COUNT(*) as count')
        )
            ->whereNotNull('department')
            ->where('status', 'completed')
            ->when(!empty($filters['department']), function ($query) use ($filters) {
                $query->where('department', $filters['department']);
            })
            ->when(!empty($filters['start_date']), function ($query) use ($filters) {
                $query->whereDate('created_at', '>=', $filters['start_date']);
            })
            ->when(!empty($filters['end_date']), function ($query) use ($filters) {
                $query->whereDate('created_at', '<=', $filters['end_date']);
            })
            ->groupBy('department')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(function ($item) {
                return [
                    'department' => $item->department ?: 'Unassigned',
                    'amount' => (float) $item->total,
                    'count' => $item->count,
                ];
            })
            ->toArray();
    }
}
