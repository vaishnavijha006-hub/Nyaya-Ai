'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/nyaya/auth-provider';
import { Logo } from '@/components/nyaya/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/nyaya/reveal';

export default function AuthPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }> | { mode?: string };
}) {
  const { signIn, signUp, user, loading } = useAuth();
  const router = useRouter();
  const browserSearchParams = useSearchParams();

  // Resolve mode from props or query string
  const [resolvedQueryMode, setResolvedQueryMode] = React.useState<'signin' | 'signup'>('signin');

  React.useEffect(() => {
    if (searchParams) {
      Promise.resolve(searchParams).then((p) => {
        if (p?.mode === 'signup' || p?.mode === 'signin') {
          setResolvedQueryMode(p.mode);
          setMode(p.mode);
        }
      });
    } else {
      const q = browserSearchParams?.get('mode');
      if (q === 'signup' || q === 'signin') {
        setResolvedQueryMode(q);
        setMode(q);
      }
    }
  }, [searchParams, browserSearchParams]);

  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  // If user is already authenticated, automatically redirect to chat
  React.useEffect(() => {
    if (user && !loading) {
      router.push('/chat');
    }
  }, [user, loading, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (mode === 'signup') {
      toast.success('Account created and signed in successfully!');
    } else {
      toast.success('Signed in successfully!');
    }
    router.push('/chat');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] opacity-40" />
      </div>

      <Reveal className="w-full max-w-md">
        <div className="glass-strong rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === 'signin' ? 'Sign in to continue to Nyaya AI' : 'Start getting cited legal answers in seconds'}
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" disabled={busy} className="group w-full gap-2 rounded-xl">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <span>{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}</span>
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
              className="font-medium text-primary hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            {['No credit card', 'Cited sources', 'Court-ready drafts'].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">← Back to home</Link>
          </p>
        </div>
      </Reveal>
    </main>
  );
}
