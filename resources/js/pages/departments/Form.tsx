import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';

interface Department {
  id?: number;
  name: string;
}

interface Props {
  department?: Department;
}

export default function DepartmentForm({ department }: Props) {
  const isEdit = !!department;

  const { data, setData, post, put, processing, errors } = useForm({
    name: department?.name || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isEdit ? put(`/departments/${department?.id}`) : post('/departments');
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Department Management', href: '/departments' },
    { title: isEdit ? 'Edit Department' : 'Create Department', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Department' : 'Create Department'} />
      <div className="flex-1 p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Edit Department' : 'Create New Department'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Update department details' : 'Add a new department to the system'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <Label htmlFor="name" className="mb-2 block">Department Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. HR"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-2">{errors.name}</p>}
              </div>

              <Separator />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <Link href="/departments" className="w-full sm:w-auto">
                  <Button type="button" variant="secondary" className="w-full">
                    Back
                  </Button>
                </Link>
                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                  {processing
                    ? <span className="animate-pulse">Saving...</span>
                    : isEdit
                      ? 'Save Changes'
                      : 'Create Department'
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
