import React from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';

interface Vessel {
  id?: number;
  name: string;
  code: string | null;
}

interface Props {
  vessel?: Vessel;
}

export default function VesselForm({ vessel }: Props) {
  const isEdit = !!vessel;

  const { data, setData, post, put, processing, errors } = useForm({
    name: vessel?.name || '',
    code: vessel?.code || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    isEdit ? put(`/vessels/${vessel?.id}`) : post('/vessels');
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Vessel Management', href: '/vessels' },
    { title: isEdit ? 'Edit Vessel' : 'Create Vessel', href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={isEdit ? 'Edit Vessel' : 'Create Vessel'} />
      <div className="flex-1 p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Edit Vessel' : 'Create New Vessel'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Update vessel details' : 'Enter vessel details for the workflow'}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-2 block">Vessel Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. MV Sta. Maria"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                    autoFocus
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-2">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="code" className="mb-2 block">Code (Optional)</Label>
                  <Input
                    id="code"
                    placeholder="e.g. SM-001"
                    value={data.code || ''}
                    onChange={(e) => setData('code', e.target.value)}
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  {errors.code && <p className="text-sm text-red-500 mt-2">{errors.code}</p>}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <Link href="/vessels" className="w-full sm:w-auto">
                  <Button type="button" variant="secondary" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                  {processing
                    ? <span className="animate-pulse">Saving...</span>
                    : isEdit
                      ? 'Save Changes'
                      : 'Create Vessel'
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
