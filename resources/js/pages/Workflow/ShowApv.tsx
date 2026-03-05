import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  FileText,
  Download,
  Send,
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
  performer?: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    departments: string[];
    created_at: string | null;
  };
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
  availableTransitions: _availableTransitions,
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
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseComment, setReleaseComment] = useState('');
  const [releaseAttachments, setReleaseAttachments] = useState<File[]>([]);
  const [releaseFileError, setReleaseFileError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<HistoryItem['performer'] | null>(null);
  void _availableTransitions; // Reserved for future use

  const breadcrumbs = [
    { title: 'Workflow', href: '/workflow' },
    { title: apv.reference_number, href: '#' },
  ];

  const handleTransition = (transition: string) => {
    if (transition === 'reject' || transition === 'reject_after_approval') {
      setActionType(transition);
      setRejectDialogOpen(true);
    } else if (transition === 'release') {
      setReleaseDialogOpen(true);
    } else {
      setProcessing(true);
      router.post(`/workflow/${apv.id}/transition`, {
        transition,
        attachments: [],
      }, {
        onFinish: () => setProcessing(false),
      });
    }
  };

  const handleReleaseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const fileErrors: string[] = [];
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];

    files.forEach((file) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExt || '')) {
        fileErrors.push(`${file.name}: Invalid file type.`);
      } else if (file.size > 10 * 1024 * 1024) {
        fileErrors.push(`${file.name}: File size exceeds 10MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    setReleaseFileError(fileErrors.length > 0 ? fileErrors.join('\n') : null);
    setReleaseAttachments((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeReleaseFile = (index: number) => {
    setReleaseAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRelease = () => {
    setProcessing(true);
    router.post(`/workflow/${apv.id}/transition`, {
      transition: 'release',
      comment: releaseComment,
      attachments: releaseAttachments,
    }, {
      forceFormData: true,
      onSuccess: () => {
        setReleaseDialogOpen(false);
        setReleaseComment('');
        setReleaseAttachments([]);
        setReleaseFileError(null);
      },
      onFinish: () => setProcessing(false),
    });
  };

  const handleReject = () => {
    setProcessing(true);
    router.post(`/workflow/${apv.id}/transition`, {
      transition: actionType,
      rejected_reason: rejectReason,
    }, {
      onSuccess: () => {
        setRejectDialogOpen(false);
        setRejectReason('');
      },
      onFinish: () => setProcessing(false),
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
            {canSubmit && apv.status === 'draft' && (
              <Button onClick={() => handleTransition('submit')} disabled={processing}>
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
            )}
            {canApprove && apv.status === 'pending_approval' && (
              <Button onClick={() => handleTransition('approve')} disabled={processing}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                variant="destructive"
                disabled={processing}
                onClick={() => handleTransition(
                  apv.status === 'approved' ? 'reject_after_approval' : 'reject'
                )}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            )}
            {canRelease && apv.status === 'approved' && (
              <Button onClick={() => handleTransition('release')} disabled={processing}>
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
                    <p className="text-sm mt-1">{apv.is_priority ? <Badge variant={'destructive'}>Urgent</Badge> : <Badge>Normal</Badge>}</p>
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
                  {/* Show creation as first timeline event */}
                  <div className="relative pl-6 pb-4 border-l-2 border-muted">
                    <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-400 ring-4 ring-background" />
                    <div className="space-y-1">
                      <p className="font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        by{' '}
                        {apv.requester ? (
                          <button
                            type="button"
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                            onClick={() => {
                              setProfileUser({
                                id: apv.requester?.id ?? 0,
                                name: apv.requester?.name ?? 'Unknown',
                                email: '',
                                roles: [],
                                departments: [],
                                created_at: null,
                              });
                              setProfileOpen(true);
                            }}
                          >
                            {apv.requester.name}
                          </button>
                        ) : (
                          <span className="font-medium text-foreground">Unknown</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apv.created_at), 'MMM dd, yyyy h:mm a')}
                      </p>
                      <Badge variant="outline" className="text-xs">Draft</Badge>
                    </div>
                  </div>
                  {/* Workflow transitions */}
                  {history.map((item) => {
                      const transitionConfig: Record<string, { label: string; icon: string; color: string }> = {
                        submit: { label: 'Submitted for Approval', icon: '📤', color: 'bg-blue-500' },
                        approve: { label: 'Approved', icon: '✅', color: 'bg-green-500' },
                        reject: { label: 'Rejected', icon: '❌', color: 'bg-red-500' },
                        reject_after_approval: { label: 'Rejected After Approval', icon: '❌', color: 'bg-red-500' },
                        release: { label: 'Payment Released', icon: '💰', color: 'bg-emerald-500' },
                      };
                      const config = transitionConfig[item.transition] || { label: item.transition.replace(/_/g, ' '), icon: '📋', color: 'bg-gray-500' };
                      const stateLabel = (state: string) => workflowStates[state]?.label || state.replace(/_/g, ' ');
                      const commentText = item.context?.comment || item.context?.comments;

                      return (
                        <div key={item.id} className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0 last:pb-0">
                          <div className={`absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full ${config.color} ring-4 ring-background`} />
                          <div className="space-y-1">
                            <p className="font-medium">{config.label}</p>
                            <p className="text-sm text-muted-foreground">
                              by{' '}
                              {item.performer ? (
                                <button
                                  type="button"
                                  className="font-medium text-foreground underline-offset-2 hover:underline"
                                  onClick={() => {
                                    setProfileUser(item.performer ?? null);
                                    setProfileOpen(true);
                                  }}
                                >
                                  {item.performer.name}
                                </button>
                              ) : (
                                <span className="font-medium text-foreground">System</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.performed_at), 'MMM dd, yyyy h:mm a')}
                            </p>
                            <div className="flex items-center gap-1 text-xs">
                              <Badge variant="outline" className="text-xs">
                                {stateLabel(item.from_state)}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                              <Badge variant="outline" className="text-xs">
                                {stateLabel(item.to_state)}
                              </Badge>
                            </div>
                            {/* Show context details like rejection reason or comments */}
                            {item.context?.rejected_reason && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400">Reason:</p>
                                <p className="text-sm text-red-600 dark:text-red-300">{item.context.rejected_reason}</p>
                              </div>
                            )}
                            {commentText && (
                              <div className="mt-2 p-2 bg-muted rounded">
                                <p className="text-xs font-medium text-muted-foreground">Comment:</p>
                                <p className="text-sm">{commentText}</p>
                              </div>
                            )}
                            {Array.isArray(item.context?.attachments) && item.context.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Attachments:</p>
                                {item.context.attachments.map((file: { name: string; path: string; size: number }, index: number) => (
                                  <div key={`${item.id}-attachment-${index}`} className="flex items-center justify-between p-2 bg-muted rounded">
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
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {profileUser ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{profileUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profileUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profileUser.roles.length > 0 ? (
                    profileUser.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs font-normal">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs font-normal">None</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profileUser.departments.length > 0 ? (
                    profileUser.departments.map((department) => (
                      <Badge key={department} variant="outline" className="text-xs font-normal">
                        {department}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs font-normal">None</Badge>
                  )}
                </div>
              </div>
              {profileUser.created_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">
                    {format(new Date(profileUser.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No user data available.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

      {/* Release Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="releaseComment">Release Comment</Label>
              <Textarea
                id="releaseComment"
                placeholder="Add an optional comment..."
                value={releaseComment}
                onChange={(e) => setReleaseComment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="releaseAttachments">Payment Proof / Documents</Label>
              <input
                id="releaseAttachments"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleReleaseFileChange}
              />
              {releaseFileError && (
                <p className="text-sm text-red-600 whitespace-pre-line">{releaseFileError}</p>
              )}
              {releaseAttachments.length > 0 && (
                <div className="space-y-2">
                  {releaseAttachments.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeReleaseFile(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRelease} disabled={processing}>
              Confirm Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
