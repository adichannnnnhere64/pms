import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import LineChartComponent from '@/components/charts/line-chart';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
];

const summaryData = [
  { label: 'PRE APV', value: 420, color: '#4ade80' },
  { label: 'POST APV', value: 80, color: '#f472b6' },
  { label: 'PAYMENT PROCESSED', value: 1570, color: '#38bdf8' },
];

const monthlyData = [
  { name: 'Jan', Users: 50, Backups: 10 },
  { name: 'Feb', Users: 120, Backups: 25 },
  { name: 'Mar', Users: 80, Backups: 15 },
  { name: 'Apr', Users: 150, Backups: 30 },
  { name: 'May', Users: 90, Backups: 20 },
  { name: 'Jun', Users: 170, Backups: 35 },
];

const pieData = [
  { name: 'Admin', value: 20, color: '#fbbf24' },
  { name: 'User', value: 80, color: '#a78bfa' },
];

const areaData = [
  { month: 'Jan', users: 400, backups: 100 },
  { month: 'Feb', users: 300, backups: 150 },
  { month: 'Mar', users: 500, backups: 200 },
  { month: 'Apr', users: 700, backups: 250 },
];

const radialData = [
  { name: 'A', value: 100, fill: '#8884d8' },
  { name: 'B', value: 80, fill: '#83a6ed' },
  { name: 'C', value: 50, fill: '#8dd1e1' },
];

const COLORS = ['#0ea5e9', '#14b8a6', '#f97316', '#9333ea'];

export default function Dashboard({chartData} : any) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>

            adi
    </AppLayout>
  );
}
