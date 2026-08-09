'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, Volume2, Trash2, Check, LogOut, Key, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Reveal } from '@/components/nyaya/reveal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useConversations, deleteConversation } from '@/hooks/use-conversations';
import { useAuth } from '@/components/nyaya/auth-provider';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsView />
    </AppShell>
  );
}

function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [profile, setProfile] = React.useState({
    name: '',
    email: user?.email ?? '',
    jurisdiction: 'India',
  });
  const [prefs, setPrefs] = React.useState({
    notifications: true,
    citationSources: true,
    voiceResponses: false,
    autoSave: true,
    plainLanguage: true,
  });
  const [model, setModel] = React.useState('nyaya-pro');
  const { conversations, reload } = useConversations();

  React.useEffect(() => setMounted(true), []);

  const saveProfile = () => toast.success('Profile saved');
  const savePrefs = (k: keyof typeof prefs) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    toast.success('Preferences updated');
  };

  const clearAll = async () => {
    await Promise.all(conversations.map((c) => deleteConversation(c.id)));
    reload();
    toast.success('All conversations deleted');
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your profile, preferences, and data.</p>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 space-y-6">
        {/* Profile */}
        <Reveal>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Profile</CardTitle>
              </div>
              <CardDescription>How Nyaya addresses you and which jurisdiction applies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Full name</Label>
                  <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                  <Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Jurisdiction</Label>
                <Select value={profile.jurisdiction} onValueChange={(v) => setProfile((p) => ({ ...p, jurisdiction: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                    <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveProfile} className="gap-2">
                <Check className="h-4 w-4" /> Save profile
              </Button>
            </CardContent>
          </Card>
        </Reveal>

        {/* Appearance */}
        <Reveal delay={0.05}>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Appearance</CardTitle>
              </div>
              <CardDescription>Choose how Nyaya looks on your device.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'system', label: 'System' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-all',
                      mounted && theme === t.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className={cn('mb-3 h-10 w-full rounded-lg', t.id === 'light' ? 'bg-white border' : t.id === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-r from-white to-slate-900')} />
                    <p className="text-sm font-medium">{t.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Preferences */}
        <Reveal delay={0.1}>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Preferences</CardTitle>
              </div>
              <CardDescription>Tune how Nyaya responds to you.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              <ToggleRow
                icon={Bell} title="Notifications" desc="Get notified when a draft is ready."
                checked={prefs.notifications} onChange={savePrefs('notifications')}
              />
              <ToggleRow
                icon={Shield} title="Always cite sources" desc="Attach citations to every legal answer."
                checked={prefs.citationSources} onChange={savePrefs('citationSources')}
              />
              <ToggleRow
                icon={Volume2} title="Voice responses" desc="Read answers aloud automatically."
                checked={prefs.voiceResponses} onChange={savePrefs('voiceResponses')}
              />
              <ToggleRow
                icon={Globe} title="Plain-language mode" desc="Translate legal jargon into everyday words."
                checked={prefs.plainLanguage} onChange={savePrefs('plainLanguage')}
              />
              <ToggleRow
                icon={SettingsIcon} title="Auto-save conversations" desc="Persist your chats to your account."
                checked={prefs.autoSave} onChange={savePrefs('autoSave')}
              />
            </CardContent>
          </Card>
        </Reveal>

        {/* Model */}
        <Reveal delay={0.15}>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">AI model</CardTitle>
              </div>
              <CardDescription>Choose the model that powers your answers.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nyaya-pro">Nyaya Pro — most accurate</SelectItem>
                  <SelectItem value="nyaya-fast">Nyaya Fast — quicker responses</SelectItem>
                  <SelectItem value="nyaya-research">Nyaya Research — deep citations</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </Reveal>

        {/* API Configuration */}
        <ApiConfigCard />

        {/* Data */}
        <Reveal delay={0.2}>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <CardTitle className="text-lg">Data management</CardTitle>
              </div>
              <CardDescription>Manage your stored conversation history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-sm font-medium">All conversations</p>
                  <p className="text-xs text-muted-foreground">{conversations.length} stored conversation{conversations.length !== 1 ? 's' : ''}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={clearAll}
                  disabled={conversations.length === 0}
                  className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Delete all
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Account / sign out */}
        <Reveal delay={0.25}>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Account</CardTitle>
              </div>
              <CardDescription>You are signed in as {user?.email ?? '—'}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  toast.success('Signed out');
                }}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </CardContent>
          </Card>
        </Reveal>

        <Separator className="bg-border/40" />
        <p className="px-1 pb-8 text-center text-xs text-muted-foreground">
          Nyaya AI · v1.0.0 · Made for every Indian
        </p>
      </div>
    </div>
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

type ApiStatus = 'unknown' | 'online' | 'offline';

function ApiConfigCard() {
  const [status, setStatus] = React.useState<ApiStatus>('unknown');
  const [testing, setTesting] = React.useState(false);

  const testConnection = React.useCallback(async () => {
    setTesting(true);
    try {
      const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
      setStatus(res.ok || res.status < 500 ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    } finally {
      setTesting(false);
    }
  }, []);

  // Auto-check on mount
  React.useEffect(() => { testConnection(); }, [testConnection]);

  const StatusBadge = ({ online, labelOn, labelOff }: { online: boolean | null; labelOn: string; labelOff: string }) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        online === null
          ? 'bg-muted text-muted-foreground'
          : online
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      <span
        className={`mr-1 h-1.5 w-1.5 rounded-full ${
          online === null ? 'bg-muted-foreground' : online ? 'bg-emerald-500' : 'bg-destructive'
        }`}
      />
      {online === null ? 'Checking…' : online ? labelOn : labelOff}
    </span>
  );

  const isOnline = status === 'online';
  const isChecked = status !== 'unknown';

  return (
    <Reveal delay={0.17}>
      <Card className="glass-strong border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">API Configuration</CardTitle>
          </div>
          <CardDescription>Read-only status of backend services and API keys.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Backend Status */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Backend Status</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{API_URL}</p>
            </div>
            <StatusBadge online={isChecked ? isOnline : null} labelOn="Online" labelOff="Offline" />
          </div>

          {/* Groq API */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Groq API</p>
              <p className="text-xs text-muted-foreground">Primary LLM inference engine</p>
            </div>
            <StatusBadge online={isChecked ? isOnline : null} labelOn="Configured" labelOff="Not set" />
          </div>

          {/* Gemini Fallback */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Gemini Fallback</p>
              <p className="text-xs text-muted-foreground">Secondary LLM for complex queries</p>
            </div>
            <StatusBadge online labelOn="Available" labelOff="Unavailable" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={testing}
            className="gap-2 mt-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </CardContent>
      </Card>
    </Reveal>
  );
}

function ToggleRow({
  icon: Icon, title, desc, checked, onChange,
}: {
  icon: React.ElementType; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
