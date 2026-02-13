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
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Particular {
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Props {
  vendorOptions: Array<{ value: string; label: string }>;
  categoryOptions: Record<string, string>;
}

export default function CreateApv({ vendorOptions, categoryOptions }: Props) {
  const { data, setData, post, processing, errors, clearErrors } = useForm<{
    vendor_name: string;
    department: string;
    notes: string;
    expected_date: string;
    particulars: Particular[];
    attachments: File[];
  }>({
    vendor_name: '',
    department: '',
    notes: '',
    expected_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    particulars: [
      { description: '', category: '', quantity: 1, unit_price: 0, amount: 0 }
    ],
    attachments: [],
  });

  // Local validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Flag to trigger submission after state update
  const [shouldSubmit, setShouldSubmit] = useState(false);

  const breadcrumbs = [
    { title: 'Workflow', href: '/workflow' },
    { title: 'Create APV', href: '#' },
  ];

  // Helper to get error for a field (checks both local and server errors)
  const getError = (field: string): string | undefined => {
    return validationErrors[field] || (errors as Record<string, string>)[field];
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.vendor_name) {
      newErrors.vendor_name = 'Vendor name is required';
    }

    if (!data.department) {
      newErrors.department = 'Department is required';
    }

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

    // Validate each particular
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

  // Submit after React state has settled
  useEffect(() => {
    if (shouldSubmit) {
      setShouldSubmit(false);
      if (validateAllFields()) {
        post('/workflow', {
          forceFormData: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldSubmit]);

  const handleParticularChange = (index: number, field: keyof Particular, value: any) => {
    const updated = [...data.particulars];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }

    setData('particulars', updated);

    // Clear validation error for this field
    const errorKey = `particulars.${index}.${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
    // Also clear server-side error
    if ((errors as Record<string, string>)[errorKey]) {
      clearErrors(errorKey as any);
    }
  };

  const addParticular = () => {
    const newParticular: Particular = { description: '', category: '', quantity: 1, unit_price: 0, amount: 0 };
    setData('particulars', [...data.particulars, newParticular]);
  };

  const removeParticular = (index: number) => {
    if (data.particulars.length > 1) {
      const updated = data.particulars.filter((_, i) => i !== index);
      setData('particulars', updated);

      // Remove and re-index validation errors
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

    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const updated = data.attachments.filter((_, i) => i !== index);
    setData('attachments', updated);
  };

  const totalAmount = data.particulars.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use flag + useEffect so validation runs after React state is settled
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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create APV" />

      <div className="flex-1 p-4 md:p-6">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Create Payment Voucher</CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Server-side general error banner */}
              {(errors as Record<string, string>).error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{(errors as Record<string, string>).error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vendor_name">Vendor Name *</Label>
                    <Select
                      value={data.vendor_name}
                      onValueChange={(value) => handleFieldChange('vendor_name', value)}
                    >
                      <SelectTrigger className={getError('vendor_name') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select vendor" />
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
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={data.department}
                      onValueChange={(value) => handleFieldChange('department', value)}
                    >
                      <SelectTrigger className={getError('department') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {getError('department') && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {getError('department')}
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

              {/* Particulars / Line Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Line Items</h3>
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
                      <h4 className="font-medium">Item #{index + 1}</h4>
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
                      <div>
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

              {/* Attachments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Attachments</h3>
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

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Link href="/workflow">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Creating...' : 'Create APV'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
