import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';

interface APV {
  id: number;
  reference_number: string;
  vendor_name: string;
  department: string;
  total_amount: number;
  status: string;
  expected_date: string;
  created_at: string;
  requester?: {
    id: number;
    name: string;
  };
  approver?: {
    name: string;
  };
  released_by?: {
    name: string;
  };
}

interface Props {
  pendingApprovals: any;
  myRequests: any;
  completed: any;
  userRoles: string[];
  workflowStats: {
    pending_approval: number;
    approved: number;
    my_drafts: number;
    my_pending: number;
  };
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusIcons: Record<string, any> = {
  draft: FileText,
  pending_approval: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  completed: CheckCircle2,
};

export default function WorkflowIndex({
  pendingApprovals,
  myRequests,
  completed,
  userRoles,
  workflowStats
}: Props) {
  const { url } = usePage();

  const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Workflow', href: '/workflow' },
  ];

  const isEncoder = userRoles.includes('encoder') || true;
  const isManager = userRoles.includes('manager');
  const isDirector = userRoles.includes('director');
  const isFinance = userRoles.includes('finance');

  const renderStatusBadge = (status: string) => {
    const StatusIcon = statusIcons[status] || AlertCircle;
    return (
      <Badge className={`${statusColors[status]} font-medium`}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const renderAPVTable = (apvs: any, showRequester = false) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2">Reference</th>
            <th className="text-left py-3 px-2">Vendor</th>
            {showRequester && <th className="text-left py-3 px-2">Requester</th>}
            <th className="text-left py-3 px-2">Department</th>
            <th className="text-right py-3 px-2">Amount</th>
            <th className="text-left py-3 px-2">Expected Date</th>
            <th className="text-left py-3 px-2">Status</th>
            <th className="text-center py-3 px-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {apvs.data.map((apv: APV) => (
            <tr key={apv.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-2 font-medium">{apv.reference_number}</td>
              <td className="py-3 px-2">{apv.vendor_name}</td>
              {showRequester && <td className="py-3 px-2">{apv.requester?.name}</td>}
              <td className="py-3 px-2">{apv.department}</td>
              <td className="py-3 px-2 text-right">₱{apv.total_amount.toLocaleString()}</td>
              <td className="py-3 px-2">{format(new Date(apv.expected_date), 'MMM dd, yyyy')}</td>
              <td className="py-3 px-2">{renderStatusBadge(apv.status)}</td>
              <td className="py-3 px-2 text-center">
                <Link href={`/workflow/${apv.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
          {apvs.data.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-muted-foreground">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Workflow Management" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workflow Management</h1>
            <p className="text-muted-foreground">
              Manage payment voucher approvals and releases
            </p>
          </div>
          {isEncoder && (
            <Link href="/workflow/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New APV
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isManager && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflowStats.pending_approval}</div>
              </CardContent>
            </Card>
          )}
          {(isDirector || isFinance) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ready for Release</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflowStats.approved}</div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">My Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflowStats.my_drafts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">My Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflowStats.my_pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-requests" className="space-y-4">
          <TabsList>
            {(isManager || isDirector || isFinance) && (
              <TabsTrigger value="pending">Pending My Action</TabsTrigger>
            )}
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {(isManager || isDirector || isFinance) && (
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Your Action</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderAPVTable(pendingApprovals, true)}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="my-requests">
            <Card>
              <CardHeader>
                <CardTitle>My Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {renderAPVTable(myRequests)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Completed & Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                {renderAPVTable(completed)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
