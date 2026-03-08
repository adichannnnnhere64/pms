import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useState, useRef } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Trash2, Upload } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const [signatureProcessing, setSignatureProcessing] = useState(false);
    const [signatureError, setSignatureError] = useState<string | null>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setSignatureError('Please upload a PNG or JPG image.');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            setSignatureError('Image size must be less than 2MB.');
            return;
        }

        setSignatureError(null);
        setSignatureProcessing(true);

        const formData = new FormData();
        formData.append('signature', file);

        router.post(route('profile.signature'), formData, {
            forceFormData: true,
            onFinish: () => {
                setSignatureProcessing(false);
                if (signatureInputRef.current) {
                    signatureInputRef.current.value = '';
                }
            },
        });
    };

    const handleDeleteSignature = () => {
        if (!confirm('Are you sure you want to delete your signature?')) return;

        setSignatureProcessing(true);
        router.delete(route('profile.signature.delete'), {
            onFinish: () => setSignatureProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your name and email address" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="mt-2 text-sm text-gray-800">
                                    Your email address is unverified.
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                                    >
                                        Click here to re-send the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-gray-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                {/* Signature Section */}
                <div className="space-y-6 border-t pt-6">
                    <HeadingSmall
                        title="Signature"
                        description="Upload your signature for document approvals. This will appear on RAF PDF documents."
                    />

                    <div className="space-y-4">
                        {/* Current Signature Preview */}
                        {auth.user.signature_url && (
                            <div className="space-y-2">
                                <Label>Current Signature</Label>
                                <div className="flex items-start gap-4">
                                    <div className="border rounded-lg p-4 bg-white">
                                        <img
                                            src={auth.user.signature_url}
                                            alt="Your signature"
                                            className="max-h-24 max-w-xs object-contain"
                                        />
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDeleteSignature}
                                        disabled={signatureProcessing}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Upload New Signature */}
                        <div className="space-y-2">
                            <Label htmlFor="signature">
                                {auth.user.signature_url ? 'Replace Signature' : 'Upload Signature'}
                            </Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    ref={signatureInputRef}
                                    id="signature"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleSignatureUpload}
                                    disabled={signatureProcessing}
                                    className="max-w-xs"
                                />
                                {signatureProcessing && (
                                    <span className="text-sm text-muted-foreground">Uploading...</span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                PNG or JPG, max 2MB. For best results, use a transparent PNG.
                            </p>
                            {signatureError && (
                                <p className="text-sm text-red-600">{signatureError}</p>
                            )}
                            {status === 'signature-updated' && (
                                <p className="text-sm text-green-600">Signature updated successfully.</p>
                            )}
                            {status === 'signature-deleted' && (
                                <p className="text-sm text-green-600">Signature removed successfully.</p>
                            )}
                        </div>
                    </div>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
