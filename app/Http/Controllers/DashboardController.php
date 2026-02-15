<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\AccountabilityPaymentVoucher;
use App\Models\AccountPayableVoucherParticular;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard', [
            'summaryStats' => $this->getSummaryStats(),
            'statusDistribution' => $this->getStatusDistribution(),
            'monthlyTrends' => $this->getMonthlyTrends(),
            'categorySpending' => $this->getCategorySpending(),
            'departmentSpending' => $this->getDepartmentSpending(),
        ]);
    }

    private function getSummaryStats(): array
    {
        $apvs = AccountabilityPaymentVoucher::query();

        return [
            'totalApvs' => AccountabilityPaymentVoucher::count(),
            'pendingApproval' => AccountabilityPaymentVoucher::where('status', 'pending_approval')->count(),
            'totalApproved' => AccountabilityPaymentVoucher::whereIn('status', ['approved', 'completed'])->count(),
            'totalAmount' => (float) AccountabilityPaymentVoucher::sum('total_amount'),
            'pendingAmount' => (float) AccountabilityPaymentVoucher::where('status', 'pending_approval')->sum('total_amount'),
        ];
    }

    private function getStatusDistribution(): array
    {
        $statuses = AccountabilityPaymentVoucher::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

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

    private function getMonthlyTrends(): array
    {
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $months->push(now()->subMonths($i)->format('Y-m'));
        }

        $apvsByMonth = AccountabilityPaymentVoucher::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(total_amount) as total')
        )
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
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

    private function getCategorySpending(): array
    {
        $categories = AccountPayableVoucherParticular::select(
            'category',
            DB::raw('SUM(amount) as total'),
            DB::raw('COUNT(*) as count')
        )
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

    private function getDepartmentSpending(): array
    {
        return AccountabilityPaymentVoucher::select(
            'department',
            DB::raw('SUM(total_amount) as total'),
            DB::raw('COUNT(*) as count')
        )
            ->whereNotNull('department')
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
