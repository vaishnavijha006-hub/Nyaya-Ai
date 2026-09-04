'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FileText, ScrollText, Settings, Menu, X, Plus, LogOut,
  FolderOpen, BarChart3, Mic, ShieldAlert, Briefcase, PenTool, Users, Scale, Home, LayoutDashboard, Sparkles
} from 'lucide-react';
import { Logo } from '@/components/nyaya/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/nyaya/auth-provider';
import { RequireAuth } from '@/components/nyaya/require-auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Simplified & Focused Primary Navigation
const primaryNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: 'Ask Nyaya', icon: MessageSquare },
  { href: '/cases', label: 'My Cases', icon: Briefcase },
  { href: '/demo', label: 'Demo Mode', icon: Sparkles },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/cluster-cases', label: 'Patterns', icon: Users },
  { href: '/lawyers', label: 'Legal Aid', icon: Scale },
  { href: '/action-plans', label: 'Action Plans', icon: FolderOpen },
  { href: '/trust', label: 'Trust & Safety', icon: ShieldAlert },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// Contextual Action Drafters
const contextualTools = [
  { href: '/rti', label: 'RTI Application' },
  { href: '/legal-notice', label: 'Legal Notice' },
  { href: '/fir', label: 'FIR Drafter' },
  { href: '/contracts', label: 'Contract Generator' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/80 bg-card lg:flex">
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
                className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card lg:hidden"
              >
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="flex h-14 items-center justify-between border-b border-border/80 px-4 bg-card lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo showWordmark={false} />
            <Link href="/chat?new=true">
              <Button size="icon" variant="ghost" className="h-9 w-9">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isContextualToolActive = contextualTools.some(t => t.href === pathname);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5 border-b border-border/60">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
        {onNavigate && (
          <button onClick={onNavigate} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-3">
        <Button asChild className="w-full justify-start gap-2 rounded-xl bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-semibold shadow-sm">
          <Link href="/chat?new=true" onClick={onNavigate}>
            <Plus className="h-4 w-4" />
            New Legal Inquiry
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2 no-scrollbar">
        <div>
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Navigation
          </p>
          <div className="space-y-0.5">
            {primaryNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold border border-amber-500/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      active ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Contextual Action Tools Accordion / Group */}
        <div>
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Document Drafters
          </p>
          <div className="space-y-0.5">
            {contextualTools.map((tool) => {
              const active = pathname === tool.href;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors pl-8',
                    active
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-amber-500' : 'bg-border')} />
                  {tool.label}
                </Link>
              );
            })}
          </div>
        </div>
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
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-amber-500 font-bold text-xs border border-slate-800">
          {initials || 'NY'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{email || 'Citizen User'}</p>
          <p className="truncate text-[11px] text-muted-foreground">Legal Portal Access</p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            toast.success('Signed out');
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
