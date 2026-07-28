'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FileText, ScrollText, Settings, Menu, X, Plus, LogOut,
  FolderOpen, BarChart3,
} from 'lucide-react';
import { Logo } from '@/components/nyaya/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/nyaya/auth-provider';
import { RequireAuth } from '@/components/nyaya/require-auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/workspace', label: 'Research Workspace', icon: FolderOpen },
  { href: '/analytics', label: 'Project Analytics', icon: BarChart3 },
  { href: '/rti', label: 'RTI Generator', icon: FileText },
  { href: '/legal-notice', label: 'Legal Notice', icon: ScrollText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-muted/20 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-background lg:hidden"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center justify-between border-b border-border/60 px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent/10" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Logo showWordmark={false} />
          <Link href="/chat">
            <Button size="icon" variant="ghost" className="h-9 w-9">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
    </RequireAuth>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
        {onNavigate && (
          <button onClick={onNavigate} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent/10 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="px-3">
        <Button asChild className="w-full justify-start gap-2 rounded-xl">
          <Link href="/chat" onClick={onNavigate}>
            <Plus className="h-4 w-4" />
            New conversation
          </Link>
        </Button>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {item.label}
              {active && (
                <motion.div layoutId="active-dot" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <SidebarUserFooter />
    </div>
  );
}

function SidebarUserFooter() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="border-t border-border/60 p-3">
      <div className="glass flex items-center gap-3 rounded-xl p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{email || 'Signed in'}</p>
          <p className="truncate text-xs text-muted-foreground">Free plan</p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            toast.success('Signed out');
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
