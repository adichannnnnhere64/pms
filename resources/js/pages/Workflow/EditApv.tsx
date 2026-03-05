import React, { useState, useEffect } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  X,
  AlertCircle,
  Download
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Particular {
  description: string;
  particular: string;
  category: string;
  quantity: number;
  is_priority: boolean;
  unit_price: number;
  amount: number;
}

interface Attachment {
  name: string;
  path: string;
  size: number;
  type: string;
}

interface Apv {
  id: number;
  vendor_name: string;
  department: string;
  particular: string;
  notes: string | null;
  is_priority: boolean;
  expected_date: string;
  attachments: Attachment[] | null;
  particulars: Array<{
    id: number;
    description: string;
    category: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

interface Props {
  apv: Apv;
  vendorOptions: Array<{ value: string; label: string }>;
  currentUserRoles: string[];
  particularOptions: Array<{ value: string; label: string }>;
  categoryOptions: Record<string, string>;
}

export default function EditApv({ apv, vendorOptions, categoryOptions, particularOptions, currentUserRoles }: Props) {
  const { data, setData, put, processing, errors, clearErrors } = useForm<{
    vendor_name: string;
    particular: string;
    department: string;
    notes: string;
    is_priority: boolean;
    expected_date: string;
    particulars: Particular[];
    existing_attachments: Attachment[];
    attachments: File[];
  }>({
    vendor_name: apv.vendor_name ?? '',
    department:  currentUserRoles[0],
    particular: apv.particular ?? '',
    notes: apv.notes ?? '',
    is_priority: Boolean(apv.is_priority),
    expected_date: format(new Date(apv.expected_date), 'yyyy-MM-dd'),
    particulars: apv.particulars.map((item) => ({
      description: item.description,
      category: item.category,
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      amount: Number(item.amount) || 0,
      particular: '',
      is_priority: false,
    })),
    existing_attachments: apv.attachments ?? [],
    attachments: [],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [shouldSubmit, setShouldSubmit] = useState(false);

  const breadcrumbs = [
    { title: 'Workflow', href: '/workflow' },
    { title: 'Edit APV', href: '#' },
  ];

  const getError = (field: string): string | undefined => {
    return validationErrors[field] || (errors as Record<string, string>)[field];
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.vendor_name) {
      newErrors.vendor_name = 'Vendor name is required';
    }

    // if (!data.department) {
    //   newErrors.department = 'Department is required';
    // }

    if (!data.expected_date) {
      newErrors.expected_date = 'Expected date is required';
    } else {
      const selectedDate = new Date(data.expected_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        newErrors.expected_date = 'Expected date must be after today';
      }
    }

    if (!data.particulars || data.particulars.length === 0) {
      newErrors.particulars = 'At least one line item is required';
    }

    data.particulars.forEach((particular, index) => {
      if (!particular.description || particular.description.trim() === '') {
        newErrors[`particulars.${index}.description`] = 'Description is required';
      }
      if (!particular.category) {
        newErrors[`particulars.${index}.category`] = 'Category is required';
      }
      if (!particular.quantity || particular.quantity < 1) {
        newErrors[`particulars.${index}.quantity`] = 'Quantity must be at least 1';
      } else if (!Number.isInteger(particular.quantity)) {
        newErrors[`particulars.${index}.quantity`] = 'Quantity must be a whole number';
      }
      if (particular.unit_price === undefined || particular.unit_price === null || particular.unit_price < 0) {
        newErrors[`particulars.${index}.unit_price`] = 'Unit price must be 0 or greater';
      }
    });

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (shouldSubmit) {
      setShouldSubmit(false);
      if (validateAllFields()) {
        put(`/workflow/${apv.id}`, {
          forceFormData: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldSubmit]);


    const handleParticularChange = (
  index: number,
  field: keyof Particular,
  value: any
) => {
  const updated = [...data.particulars];

  const currentItem = { ...updated[index], [field]: value };

  const quantity =
    field === 'quantity' ? value : currentItem.quantity;

  const unitPrice =
    field === 'unit_price' ? value : currentItem.unit_price;

  currentItem.amount =
    (Number(quantity) || 0) * (Number(unitPrice) || 0);

  updated[index] = currentItem;

  setData('particulars', updated);
};

  const addParticular = () => {
    const newParticular: Particular = { description: '', category: '', quantity: 1, unit_price: 0, amount: 0, particular: '', is_priority: false };
    setData('particulars', [...data.particulars, newParticular]);
  };

  const removeParticular = (index: number) => {
    if (data.particulars.length > 1) {
      const updated = data.particulars.filter((_, i) => i !== index);
      setData('particulars', updated);

      const newErrors: Record<string, string> = {};
      Object.keys(validationErrors).forEach(key => {
        const match = key.match(/^particulars\.(\d+)\.(.+)$/);
        if (match) {
          const errIndex = parseInt(match[1]);
          const field = match[2];
          if (errIndex < index) {
            newErrors[key] = validationErrors[key];
          } else if (errIndex > index) {
            newErrors[`particulars.${errIndex - 1}.${field}`] = validationErrors[key];
          }
        } else {
          newErrors[key] = validationErrors[key];
        }
      });
      setValidationErrors(newErrors);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles: File[] = [];
    const fileErrors: string[] = [];

    files.forEach(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png'];

      if (!allowedTypes.includes(fileExt || '')) {
        fileErrors.push(`${file.name}: Invalid file type. Only PDF, JPG, JPEG, PNG are allowed.`);
      } else if (file.size > 5 * 1024 * 1024) {
        fileErrors.push(`${file.name}: File size exceeds 5MB limit.`);
      } else {
        validFiles.push(file);
      }
    });

    if (fileErrors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        attachments: fileErrors.join('\n')
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.attachments;
        return newErrors;
      });
    }

    setData('attachments', [...data.attachments, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const updated = data.attachments.filter((_, i) => i !== index);
    setData('attachments', updated);
  };

  const removeExistingAttachment = (index: number) => {
    const updated = data.existing_attachments.filter((_, i) => i !== index);
    setData('existing_attachments', updated);
  };

  const totalAmount = data.particulars.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShouldSubmit(true);
  };

  const handleFieldChange = (field: string, value: any) => {
    setData(field as any, value);
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if ((errors as Record<string, string>)[field]) {
      clearErrors(field as any);
    }
  };

  const allRoles = [
    "IT",
    "Finance",
    "HR",
    "Operations",
    "encoder",
    "Marketing",
    "Admin",
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit APV" />

      <div className="flex-1 p-4 md:p-6">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Payment Voucher</CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {(errors as Record<string, string>).error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{(errors as Record<string, string>).error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vendor_name">Vessel Name *</Label>
                    <Select
                      value={data.vendor_name}
                      onValueChange={(value) => handleFieldChange('vendor_name', value)}
                    >
                      <SelectTrigger className={getError('vendor_name') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select vessel" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorOptions.map((vendor) => (
                          <SelectItem key={vendor.value} value={vendor.value}>
                            {vendor.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getError('vendor_name') && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getError('vendor_name')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_date">Expected Date *</Label>
                    <Input
                      id="expected_date"
                      type="date"
                      value={data.expected_date}
                      onChange={(e) => handleFieldChange('expected_date', e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className={getError('expected_date') ? 'border-red-500' : ''}
                    />
                    {getError('expected_date') && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getError('expected_date')}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="space-y-3 border rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_priority"
                          checked={data.is_priority}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setData('is_priority', true);
                            } else {
                              setData('is_priority', false);
                            }
                          }}
                        />
                        <Label htmlFor="is_priority" className="text-sm font-normal cursor-pointer">
                          Is Priority?
                        </Label>
                      </div>
                    </div>
                    {errors.is_priority && <p className="text-sm text-red-500 mt-2">{errors.is_priority}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="particular">Particulars</Label>
                    <Select
                      value={data.particular}
                      onValueChange={(value) => handleFieldChange('particular', value)}
                    >
                      <SelectTrigger className={getError('particular') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select particulars" />
                      </SelectTrigger>
                      <SelectContent>
                        {particularOptions.map((vendor) => (
                          <SelectItem key={vendor.value} value={vendor.value}>
                            {vendor.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getError('particular') && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getError('particular')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any additional notes..."
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Supplier Name</h3>
                  <Button type="button" onClick={addParticular} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {getError('particulars') && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{getError('particulars')}</AlertDescription>
                  </Alert>
                )}

                {data.particulars.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Name of Supplier #{index + 1}</h4>
                      {data.particulars.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticular(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="lg:col-span-2">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleParticularChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className={getError(`particulars.${index}.description`) ? 'border-red-500' : ''}
                        />
                        {getError(`particulars.${index}.description`) && (
                          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {getError(`particulars.${index}.description`)}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Category *</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value) => handleParticularChange(index, 'category', value)}
                        >
                          <SelectTrigger className={getError(`particulars.${index}.category`) ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryOptions).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {getError(`particulars.${index}.category`) && (
                          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {getError(`particulars.${index}.category`)}
                          </p>
                        )}
                      </div>
                      <div className="hidden">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleParticularChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className={getError(`particulars.${index}.quantity`) ? 'border-red-500' : ''}
                        />
                        {getError(`particulars.${index}.quantity`) && (
                          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {getError(`particulars.${index}.quantity`)}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Unit Price *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleParticularChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className={getError(`particulars.${index}.unit_price`) ? 'border-red-500' : ''}
                        />
                        {getError(`particulars.${index}.unit_price`) && (
                          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {getError(`particulars.${index}.unit_price`)}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="text"
                          value={`₱ ${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <div className="text-lg font-semibold">
                    Total Amount: ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Attachments</h3>

                {data.existing_attachments.length > 0 && (
                  <div className="space-y-2">
                    {data.existing_attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/storage/${file.path}`} download>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`border-2 border-dashed rounded-lg p-6 ${validationErrors.attachments ? 'border-red-500' : ''}`}>
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-2">
                      <Label htmlFor="attachments" className="cursor-pointer">
                        <span className="text-primary hover:underline">Upload files</span>
                        <Input
                          id="attachments"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG up to 5MB each
                      </p>
                    </div>
                  </div>

                  {validationErrors.attachments && (
                    <p className="text-sm text-red-500 mt-2 text-center whitespace-pre-line">
                      {validationErrors.attachments}
                    </p>
                  )}

                  {data.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {data.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Link href="/workflow">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Updating...' : 'Update APV'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
