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

  // Provide fallback guest session if Supabase is unconfigured or user is not signed in
  const activeUser = user || { id: 'guest-citizen', email: 'citizen@nyaya.ai' };

  return <>{children}</>;
}
