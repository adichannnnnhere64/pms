import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Download,
  Send,
  UserCheck,
  DollarSign,
} from 'lucide-react';
import { Label } from '@radix-ui/react-label';

interface APV {
  id: number;
  reference_number: string;
  vendor_name: string;
  department: string;
  particular: string;
  is_priority: boolean;
  total_amount: number;
  status: string;
  notes: string | null;
  expected_date: string;
  attachments: Array<{ name: string; path: string; size: number; type: string }> | null;
  created_at: string;
  rejected_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
  released_by: number | null;
  released_at: string | null;
  requester?: { id: number; name: string };
  approver?: { name: string };
  released_by_user?: { name: string };
  particulars: Array<{
    id: number;
    description: string;
    category: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

interface Transition {
  [key: string]: {
    to: string;
    guard: string;
  };
}

interface HistoryItem {
  id: number;
  transition: string;
  from_state: string;
  to_state: string;
  performed_by: number;
  performed_at: string;
  context: any;
  performer?: { name: string };
}

interface Props {
  apv: APV;
  availableTransitions: Transition;
  history: HistoryItem[];
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canRelease: boolean;
  workflowStates: Record<string, { label: string; color: string }>;
}

export default function ShowApv({
  apv,
  availableTransitions,
  history,
  canEdit,
  canSubmit,
  canApprove,
  canReject,
  canRelease,
  workflowStates,
}: Props) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState<'reject' | 'reject_after_approval'>('reject');

  const { post, processing } = useForm();

  const breadcrumbs = [
    { title: 'Workflow', href: '/workflow' },
    { title: apv.reference_number, href: '#' },
  ];

  const handleTransition = (transition: string) => {
    if (transition === 'reject' || transition === 'reject_after_approval') {
      setActionType(transition);
      setRejectDialogOpen(true);
    } else {
      post(`/workflow/${apv.id}/transition`, {
        data: { transition, attachments: [] },
      });
    }
  };

  const handleReject = () => {
    post(`/workflow/${apv.id}/transition`, {
      data: {
        transition: actionType,
        rejected_reason: rejectReason,
      },
      onSuccess: () => {
        setRejectDialogOpen(false);
        setRejectReason('');
      },
    });
  };

  const statusColor = workflowStates[apv.status]?.color || 'gray';
  const statusLabel = workflowStates[apv.status]?.label || apv.status;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`APV ${apv.reference_number}`} />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Link href="/workflow" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Workflow
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{apv.reference_number}</h1>
              <Badge className={`bg-${statusColor}-100 text-${statusColor}-800`}>
                {statusLabel}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Created by {apv.requester?.name} on {format(new Date(apv.created_at), 'MMM dd, yyyy h:mm a')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {canEdit && (
              <Link href={`/workflow/${apv.id}/edit`}>
                <Button variant="outline">Edit</Button>
              </Link>
            )}
            {canSubmit && Object.keys(availableTransitions).includes('submit') && (
              <Button onClick={() => handleTransition('submit')}>
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            )}
            {canApprove && Object.keys(availableTransitions).includes('approve') && (
              <Button onClick={() => handleTransition('approve')}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                variant="destructive"
                onClick={() => handleTransition(
                  apv.status === 'approved' ? 'reject_after_approval' : 'reject'
                )}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            )}
            {canRelease && Object.keys(availableTransitions).includes('release') && (
              <Button onClick={() => handleTransition('release')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Release Payment
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Voucher Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium">{apv.vendor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{apv.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Date</p>
                    <p className="font-medium">{format(new Date(apv.expected_date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium text-lg">₱{apv.total_amount.toLocaleString()}</p>
                  </div>
                </div>


                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {apv.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm mt-1">{apv.notes}</p>
                  </div>
                )}
                {apv.particular && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Particular</p>
                    <p className="text-sm mt-1">{apv.particular}</p>
                  </div>
                )}
                  <div className="mt-4">
                    <p className="text-sm mt-1">{apv.is_priority ? <Badge variant={'destructive'} >Urgent</Badge>  : <Badge  >Normal</Badge>}</p>
                  </div>
                  </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apv.particulars.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₱{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₱{item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">₱{apv.total_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Attachments */}
            {apv.attachments && apv.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {apv.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/storage/${file.path}`} download>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Approval Status */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={`bg-${statusColor}-100 text-${statusColor}-800`}>
                    {statusLabel}
                  </Badge>
                </div>

                {apv.approved_by && (
                  <div>
                    <p className="text-sm text-muted-foreground">Approved By</p>
                    <p className="font-medium">{apv.approver?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {apv.approved_at && format(new Date(apv.approved_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                )}

                {apv.released_by && (
                  <div>
                    <p className="text-sm text-muted-foreground">Released By</p>
                    <p className="font-medium">{apv.released_by_user?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {apv.released_at && format(new Date(apv.released_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                )}

                {apv.rejected_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Rejection Reason</p>
                    <p className="text-sm text-red-600">{apv.rejected_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow History */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={item.id} className="relative pl-6 pb-4 border-l last:border-l-0 last:pb-0">
                      <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary" />
                      <div className="space-y-1">
                        <p className="font-medium capitalize">{item.transition.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.performer?.name || 'System'} • {format(new Date(item.performed_at), 'MMM dd, yyyy h:mm a')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.from_state} → {item.to_state}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject APV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for Rejection *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Please provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || processing}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
