import { useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface Props {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
}

export default function AppSidebarLayout({
  children,
  breadcrumbs = [],
  title = 'Dashboard',
}: Props) {
  const { props } = usePage();

  const flash = (props?.flash as { success?: string; error?: string }) ?? {};
  const errors = (props as { errors?: Record<string, string | string[]> })?.errors ?? {};
  const setting = props?.setting as {
    nama_app: string;
    logo?: string;
    warna?: string;
    seo?: {
      title?: string;
      description?: string;
      keywords?: string;
    };
  };

  useEffect(() => {
    if (flash.success) toast.success(flash.success);
    if (flash.error) toast.error(flash.error);
  }, [flash]);

  const lastErrorRef = useRef<string>('');
  const toastErrorOnce = (message: string) => {
    if (!message) return;
    if (lastErrorRef.current === message) return;
    lastErrorRef.current = message;
    toast.error(message);
  };

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

  const primaryColor = setting?.warna || '#0ea5e9';
  const primaryForeground = '#ffffff';


//     useEffect(() => {
//   const unsubscribe = router.on('success', (event) => {
//     // or when coming from specific pages
//     if (event.detail?.visit?.method && event.detail.visit.method !== 'get') {
//       router.reload({ only: ['menus'] });
//     }
//   });
//
//   return () => unsubscribe();
// }, []);



  return (
    <>
      <Head>
        <title>{title ?? setting?.seo?.title ?? setting?.nama_app ?? 'Dashboard'}</title>
        {setting?.seo?.description && (
          <meta name="description" content={setting.seo.description} />
        )}
        {setting?.seo?.keywords && (
          <meta name="keywords" content={setting.seo.keywords} />
        )}
        <style>
          {`
            :root {
              --primary: ${primaryColor};
              --color-primary: ${primaryColor};
              --primary-foreground: ${primaryForeground};
              --color-primary-foreground: ${primaryForeground};
            }
            .dark {
              --primary: ${primaryColor};
              --color-primary: ${primaryColor};
              --primary-foreground: ${primaryForeground};
              --color-primary-foreground: ${primaryForeground};
            }
          `}
        </style>
      </Head>

      <div
        style={{
          ['--primary' as any]: primaryColor,
          ['--primary-foreground' as any]: primaryForeground,
          ['--color-primary' as any]: primaryColor,
          ['--color-primary-foreground' as any]: primaryForeground,
        }}
      >
        <AppShell variant="sidebar">
          <AppSidebar />
          <AppContent variant="sidebar">
            <AppSidebarHeader breadcrumbs={breadcrumbs} />
            {children}
          </AppContent>
        </AppShell>
      </div>

      <Toaster />
    </>
  );
}
