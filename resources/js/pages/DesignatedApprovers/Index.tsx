import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, GripVertical, UserCheck, Wallet } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Settings', href: '/settingsapp' },
  { title: 'Designated Approvers', href: '/designated-approvers' },
];

interface User {
  id: number;
  name: string;
  email: string;
  signature_url?: string | null;
}

interface DesignatedApprover {
  id: number;
  user_id: number;
  approval_type: 'approver' | 'releaser';
  title: string | null;
  order: number;
  is_required: boolean;
  is_active: boolean;
  user: User;
}

interface Props {
  approvers: DesignatedApprover[];
  releasers: DesignatedApprover[];
  availableUsers: User[];
  approverUserIds: number[];
  releaserUserIds: number[];
}

export default function DesignatedApproversIndex({
  approvers,
  releasers,
  availableUsers,
  approverUserIds,
  releaserUserIds,
}: Props) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<'approver' | 'releaser'>('approver');

  const { data, setData, post, processing, errors, reset } = useForm({
    user_id: '',
    approval_type: 'approver' as 'approver' | 'releaser',
    title: '',
    is_required: false,
  });

  const openAddDialog = (type: 'approver' | 'releaser') => {
    setAddType(type);
    setData({
      user_id: '',
      approval_type: type,
      title: '',
      is_required: false,
    });
    setAddDialogOpen(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('designated-approvers.store'), {
      onSuccess: () => {
        setAddDialogOpen(false);
        reset();
      },
    });
  };

  const handleToggleActive = (approver: DesignatedApprover) => {
    router.put(route('designated-approvers.update', approver.id), {
      is_active: !approver.is_active,
    }, { preserveScroll: true });
  };

  const handleToggleRequired = (approver: DesignatedApprover) => {
    router.put(route('designated-approvers.update', approver.id), {
      is_required: !approver.is_required,
    }, { preserveScroll: true });
  };

  const handleUpdateTitle = (approver: DesignatedApprover, title: string) => {
    router.put(route('designated-approvers.update', approver.id), {
      title,
    }, { preserveScroll: true });
  };

  const handleDelete = (approver: DesignatedApprover) => {
    router.delete(route('designated-approvers.destroy', approver.id), {
      preserveScroll: true,
    });
  };

  const getAvailableUsersForType = (type: 'approver' | 'releaser') => {
    const usedIds = type === 'approver' ? approverUserIds : releaserUserIds;
    return availableUsers.filter(user => !usedIds.includes(user.id));
  };

  const renderApproverCard = (approver: DesignatedApprover) => (
    <div
      key={approver.id}
      className={`flex items-center gap-4 p-4 border rounded-lg ${
        !approver.is_active ? 'opacity-50 bg-muted' : 'bg-background'
      }`}
    >
      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{approver.user.name}</span>
          {approver.is_required && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
          {approver.user.signature_url && (
            <Badge variant="outline" className="text-xs">Has Signature</Badge>
          )}
          {!approver.is_active && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{approver.user.email}</p>
        <Input
          className="mt-2 max-w-xs"
          placeholder="Title (e.g., Operations Manager)"
          defaultValue={approver.title || ''}
          onBlur={(e) => {
            if (e.target.value !== (approver.title || '')) {
              handleUpdateTitle(approver, e.target.value);
            }
          }}
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Label htmlFor={`required-${approver.id}`} className="text-sm">Required</Label>
          <Switch
            id={`required-${approver.id}`}
            checked={approver.is_required}
            onCheckedChange={() => handleToggleRequired(approver)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${approver.id}`} className="text-sm">Active</Label>
          <Switch
            id={`active-${approver.id}`}
            checked={approver.is_active}
            onCheckedChange={() => handleToggleActive(approver)}
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Designated Approver</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {approver.user.name} as a designated {approver.approval_type}?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(approver)}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Designated Approvers" />

      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Designated Approvers</h1>
          <p className="text-muted-foreground">
            Configure which users are authorized to approve and release RAF forms.
            These users will also appear on the PDF signatures section.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Approvers Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <CardTitle>Approvers</CardTitle>
                </div>
                <Button size="sm" onClick={() => openAddDialog('approver')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Approver
                </Button>
              </div>
              <CardDescription>
                Users who can approve RAF forms. They will be listed in the PDF approval section.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  No designated approvers configured.
                  <br />
                  <span className="text-sm">Add approvers to enable approval workflow.</span>
                </div>
              ) : (
                approvers.map(renderApproverCard)
              )}
            </CardContent>
          </Card>

          {/* Releasers Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <CardTitle>Releasers</CardTitle>
                </div>
                <Button size="sm" onClick={() => openAddDialog('releaser')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Releaser
                </Button>
              </div>
              <CardDescription>
                Users who can release payments for approved RAF forms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {releasers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  No designated releasers configured.
                  <br />
                  <span className="text-sm">Add releasers to enable payment release.</span>
                </div>
              ) : (
                releasers.map(renderApproverCard)
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Approvers</strong> are users who can approve RAF forms that are pending approval.
              Only active designated approvers can perform approvals.
            </p>
            <p>
              <strong>Releasers</strong> are users who can release payments for approved RAF forms.
              Only active designated releasers can release payments.
            </p>
            <p>
              <strong className="text-destructive">Required</strong> approvers must sign off before the RAF can proceed to the releasing stage.
              Optional approvers can sign off but are not mandatory.
            </p>
            <p>
              The <strong>Title</strong> field (e.g., "Operations Manager") will appear in the PDF
              signature section below each approver's name.
            </p>
            <p>
              Make sure each designated user has uploaded their <strong>signature</strong> in their
              profile settings for it to appear in the PDF.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Designated {addType === 'approver' ? 'Approver' : 'Releaser'}
            </DialogTitle>
            <DialogDescription>
              Select a user to designate as {addType === 'approver' ? 'an approver' : 'a releaser'}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">User</Label>
              <Select
                value={data.user_id}
                onValueChange={(value) => setData('user_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsersForType(addType).map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="text-sm text-destructive">{errors.user_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder={addType === 'approver' ? 'e.g., Operations Manager' : 'e.g., Finance Director'}
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This title will appear in the PDF signature section.
              </p>
            </div>

            <div className="flex items-center gap-3 py-2">
              <Switch
                id="is_required"
                checked={data.is_required}
                onCheckedChange={(checked) => setData('is_required', checked)}
              />
              <div>
                <Label htmlFor="is_required">Required approval</Label>
                <p className="text-xs text-muted-foreground">
                  If enabled, this {addType === 'approver' ? 'approver must sign off before releasing' : 'releaser must sign off to complete'}.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing || !data.user_id}>
                Add {addType === 'approver' ? 'Approver' : 'Releaser'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
