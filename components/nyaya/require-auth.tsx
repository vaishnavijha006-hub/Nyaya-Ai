'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/nyaya/auth-provider';
import { Logo } from '@/components/nyaya/logo';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo showWordmark={false} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your workspace…
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        </div>
        <div className="glass-strong max-w-md rounded-3xl p-8 text-center">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">Sign in to continue</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Nyaya AI keeps your conversations private to your account. Please sign in to access the assistant, generators, and settings.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-xl"><Link href="/auth">Sign in</Link></Button>
            <Button asChild variant="outline" className="rounded-xl"><Link href="/auth">Create account</Link></Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">← Back to home</Link>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
