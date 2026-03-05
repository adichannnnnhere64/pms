import { useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { type BreadcrumbItem } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface AppHeaderLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppHeaderLayout({ children, breadcrumbs }: AppHeaderLayoutProps) {
    const { props } = usePage();
    const flash = (props?.flash as { success?: string; error?: string }) ?? {};
    const errors = (props as { errors?: Record<string, string | string[]> })?.errors ?? {};
    const lastErrorRef = useRef<string>('');

    const toastErrorOnce = (message: string) => {
        if (!message) return;
        if (lastErrorRef.current === message) return;
        lastErrorRef.current = message;
        toast.error(message);
    };

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const messages = Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean);
        if (messages.length > 0) {
            toastErrorOnce(messages[0]);
        }
    }, [errors]);

    useEffect(() => {
        const unsubscribeInvalid = router.on('invalid', (event) => {
            const invalidErrors = (event as { detail?: { errors?: Record<string, string | string[]> } }).detail?.errors ?? {};
            const messages = Object.values(invalidErrors)
                .flatMap((value) => (Array.isArray(value) ? value : [value]))
                .filter(Boolean);
            if (messages.length > 0) {
                toastErrorOnce(messages[0]);
            }
        });

        const unsubscribeError = router.on('error', () => {
            toastErrorOnce('Request failed. Please try again.');
        });

        const unsubscribeException = router.on('exception', (event) => {
            const message = (event as { detail?: { exception?: { message?: string } } }).detail?.exception?.message;
            toastErrorOnce(message || 'Unexpected error occurred.');
        });

        return () => {
            unsubscribeInvalid();
            unsubscribeError();
            unsubscribeException();
        };
    }, []);

    return (
        <>
            <AppShell>
                <AppHeader breadcrumbs={breadcrumbs} />
                <AppContent>{children}</AppContent>
            </AppShell>
            <Toaster />
        </>
    );
}
