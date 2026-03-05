import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Briefcase } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Department Management',
    href: '/departments',
  },
];

interface Department {
  id: number;
  name: string;
  users_count: number;
}

interface Props {
  departments: Department[];
}

export default function DepartmentIndex({ departments }: Props) {
  const { delete: destroy, processing } = useForm();

  const handleDelete = (id: number) => {
    destroy(`/departments/${id}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Department Management" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Department Management</h1>
            <p className="text-muted-foreground">Manage department list and assignments.</p>
          </div>
          <Link href="/departments/create">
            <Button className="w-full md:w-auto" size="sm">
              + Add Department
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {departments.length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No department data available.
              </CardContent>
            </Card>
          )}

          {departments.map((department) => (
            <Card key={department.id} className="border shadow-sm">
              <CardHeader className="bg-muted/40 border-b md:flex-row md:items-center md:justify-between md:space-y-0 space-y-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {department.name}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs font-normal">
                      {department.users_count} user{department.users_count === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/departments/${department.id}/edit`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Department <strong>{department.name}</strong> will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(department.id)}
                          disabled={processing}
                        >
                          Yes, Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
