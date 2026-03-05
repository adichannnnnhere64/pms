import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  Legend
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
];

interface SummaryStats {
  totalApvs: number;
  pendingApproval: number;
  totalApproved: number;
  totalAmount: number;
  pendingAmount: number;
}

interface StatusItem {
  name: string;
  value: number;
  color: string;
}

interface MonthlyTrend {
  month: string;
  count: number;
  amount: number;
}

interface CategorySpending {
  category: string;
  amount: number;
  count: number;
}

interface DepartmentSpending {
  department: string;
  amount: number;
  count: number;
}

interface DashboardProps {
  summaryStats: SummaryStats;
  statusDistribution: StatusItem[];
  monthlyTrends: MonthlyTrend[];
  categorySpending: CategorySpending[];
  departmentSpending: DepartmentSpending[];
  departments: string[];
  filters: {
    department: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  canViewCharts: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-PH').format(value);
};

export default function Dashboard({
  summaryStats,
  statusDistribution,
  monthlyTrends,
  categorySpending,
  departmentSpending,
  departments,
  filters,
  canViewCharts,
}: DashboardProps) {
  const [filterState, setFilterState] = useState({
    department: filters?.department ?? 'all',
    status: filters?.status ?? 'all',
    startDate: filters?.start_date ?? '',
    endDate: filters?.end_date ?? '',
  });

  const applyFilters = () => {
    router.get(
      '/dashboard',
      {
        department: filterState.department,
        status: filterState.status,
        start_date: filterState.startDate,
        end_date: filterState.endDate,
      },
      { preserveState: true, replace: true }
    );
  };

  const clearFilters = () => {
    setFilterState({
      department: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
    });
    router.get('/dashboard', {}, { preserveState: true, replace: true });
  };

  const summaryData = [
    { label: 'Total RAF', value: formatNumber(summaryStats?.totalApvs ?? 0), color: '#3b82f6' },
    { label: 'Pending Approval', value: formatNumber(summaryStats?.pendingApproval ?? 0), color: '#fbbf24' },
    { label: 'Approved', value: formatNumber(summaryStats?.totalApproved ?? 0), color: '#22c55e' },
    { label: 'Total Amount', value: formatCurrency(summaryStats?.totalAmount ?? 0), color: '#8b5cf6' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-6 p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryData.map((item, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {canViewCharts ? (
          <>
            <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Filters</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <Select
                    value={filterState.department}
                    onValueChange={(value) => setFilterState((prev) => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Overall</label>
                  <Select
                    value={filterState.status}
                    onValueChange={(value) => setFilterState((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Overall" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Overall</SelectItem>
                      <SelectItem value="draft">Pending</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Released</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={filterState.startDate}
                    onChange={(e) => setFilterState((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={filterState.endDate}
                    onChange={(e) => setFilterState((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 md:col-span-4">
                  <Button onClick={applyFilters}>Apply Filters</Button>
                  <Button variant="secondary" onClick={clearFilters}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* APV Status Distribution - Pie Chart */}
              <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">APV Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution ?? []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                        labelLine={false}
                      >
                        {(statusDistribution ?? []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, 'Count']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly APV Trends - Area Chart */}
              <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Monthly APV Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends ?? []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'count' ? value : formatCurrency(value),
                          name === 'count' ? 'APV Count' : 'Total Amount'
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        name="APV Count"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spending by Category - Bar Chart */}
              <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Spending by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categorySpending ?? []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <XAxis
                        dataKey="category"
                        stroke="#6b7280"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Amount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Spending - Horizontal Bar Chart */}
              <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Spending by Department</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentSpending ?? []}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                    >
                      <XAxis
                        type="number"
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="department"
                        stroke="#6b7280"
                        fontSize={11}
                        width={75}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          'Amount'
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#14b8a6"
                        radius={[0, 4, 4, 0]}
                        name="Amount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white">Charts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Charts are available to managers and supervisors only.
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
