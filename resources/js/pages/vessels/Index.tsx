import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Vessel Management',
    href: '/vessels',
  },
];

interface Vessel {
  id: number;
  name: string;
  code: string | null;
  created_at: string;
}

interface Props {
  vessels: {
    data: Vessel[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
}

export default function VesselIndex({ vessels }: Props) {
  const { delete: destroy, processing } = useForm();

  const handleDelete = (id: number) => {
    destroy(`/vessels/${id}`, {
      preserveScroll: true,
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Vessel Management" />
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vessel Management</h1>
            <p className="text-muted-foreground">Manage vessels for the payment voucher workflow.</p>
          </div>
          <Link href="/vessels/create">
            <Button className="w-full md:w-auto" size="sm">+ Add Vessel</Button>
          </Link>
        </div>

        <div className="space-y-2 divide-y rounded-md border bg-background">
          {vessels.data.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No vessel data available.</div>
          ) : (
            vessels.data.map((vessel) => (
              <div
                key={vessel.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 py-5 hover:bg-muted/50 transition"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="space-y-1">
                    <div className="text-base font-medium">{vessel.name}</div>
                    {vessel.code && (
                      <div className="text-sm text-muted-foreground">Code: {vessel.code}</div>
                    )}
                    <div className="text-xs text-muted-foreground italic">
                      Added {dayjs(vessel.created_at).fromNow()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link href={`/vessels/${vessel.id}/edit`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vessel?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Vessel <strong>{vessel.name}</strong> will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(vessel.id)}
                          disabled={processing}
                        >
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Simple Pagination */}
        {vessels.links.length > 3 && (
          <div className="flex justify-center gap-2 mt-4">
            {vessels.links.map((link, i) => (
              <Link
                key={i}
                href={link.url || '#'}
                className={`px-3 py-1 text-sm rounded-md border ${
                  link.active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
