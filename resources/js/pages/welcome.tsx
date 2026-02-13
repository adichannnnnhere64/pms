import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useEffect } from 'react';

export default function Welcome() {
  const { auth, setting } = usePage<SharedData>().props;

  const primaryColor = setting?.warna || '#0ea5e9';
  const primaryForeground = '#ffffff';

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--primary-foreground', primaryForeground);
    document.documentElement.style.setProperty('--color-primary-foreground', primaryForeground);
  }, [primaryColor, primaryForeground]);

  return (
    <>
      <Head title="Welcome" />
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-background to-gray-50 dark:to-gray-900">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-[var(--primary)]/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl text-center space-y-8 z-10">
          {/* Header section */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80">
                            Accounts Payable Voucher System
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Personally Handcrafted by Carlo Cahoy.
            </p>
          </div>

          {/* CTA section */}
          {auth.user ? (
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                Go to Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3 rounded-lg border border-border bg-white dark:bg-gray-800 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                Sign In
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
