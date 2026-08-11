'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/nyaya/app-shell';
import { 
  Briefcase, MapPin, Star, ShieldCheck, CheckCircle2, 
  MessageSquare, Loader2, Share2, Scale 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MOCK_LAWYERS, CITIES, SPECIALTIES, type Lawyer } from '@/lib/mock-lawyers';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

export default function LawyersPage() {
  const [cityFilter, setCityFilter] = React.useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const [selectedLawyer, setSelectedLawyer] = React.useState<Lawyer | null>(null);

  const [lawyers, setLawyers] = React.useState<Lawyer[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchLawyers() {
      try {
        const { data, error } = await supabase
          .from('lawyers')
          .select('*')
          .order('rating', { ascending: false });

        if (error || !data || data.length === 0) {
          console.warn('Using mock lawyers fallback', error?.message);
          setLawyers(MOCK_LAWYERS);
        } else {
          setLawyers(data.map((row: any) => ({
            id: row.id,
            name: row.name,
            specialties: row.specialties || [],
            languages: [], // Not in schema, fallback
            experienceYears: row.experience_years,
            location: row.location,
            bio: row.bio,
            avatarUrl: row.avatar_url,
            verified: row.verified,
            rating: row.rating,
            casesWon: 0,
          })));
        }
      } catch (err) {
        setLawyers(MOCK_LAWYERS);
      } finally {
        setLoading(false);
      }
    }
    fetchLawyers();
  }, []);

  const filteredLawyers = React.useMemo(() => {
    return lawyers.filter((lawyer) => {
      const matchesCity = cityFilter === 'all' || lawyer.location === cityFilter;
      const matchesSpecialty = specialtyFilter === 'all' || lawyer.specialties.includes(specialtyFilter);
      const matchesSearch = lawyer.name.toLowerCase().includes(search.toLowerCase()) || 
                            lawyer.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()));
      return matchesCity && matchesSpecialty && matchesSearch;
    });
  }, [cityFilter, specialtyFilter, search, lawyers]);

  return (
    <AppShell>
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border/60 py-8 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <ShieldCheck className="h-4 w-4" />
              Verified Network
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Connect with a Lawyer</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Found your legal answers and ready to take action? Connect with top-rated advocates 
              across India. Share your Nyaya AI chat context with them to save consultation time.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-border/60 bg-background sticky top-0 z-10 px-4 sm:px-8 py-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or specialty..." 
                className="pl-9 w-full rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-[150px] rounded-xl">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 bg-muted/10 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            {filteredLawyers.length === 0 ? (
              <div className="text-center py-20">
                <Scale className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No lawyers found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredLawyers.map((lawyer) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={lawyer.id}
                      className="glass rounded-2xl p-5 flex flex-col gap-4 border border-border/60 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <img 
                          src={lawyer.avatarUrl} 
                          alt={lawyer.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-background shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate flex items-center gap-1.5">
                            {lawyer.name}
                            {lawyer.verified && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lawyer.location}</span>
                            <span className="flex items-center gap-1 text-amber-500 font-medium"><Star className="h-3 w-3 fill-current" /> {lawyer.rating}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                        {lawyer.bio}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {lawyer.specialties.map(s => (
                          <span key={s} className="px-2 py-1 rounded-md bg-accent/10 text-accent-foreground text-[10px] font-medium border border-accent/20">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/60">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{lawyer.experienceYears} yrs</span> exp
                        </div>
                        <Button size="sm" className="rounded-xl" onClick={() => setSelectedLawyer(lawyer)}>
                          Contact <MessageSquare className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <ContactModal 
        lawyer={selectedLawyer} 
        onClose={() => setSelectedLawyer(null)} 
      />
    </AppShell>
  );
}

function ContactModal({ lawyer, onClose }: { lawyer: Lawyer | null, onClose: () => void }) {
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [shareContext, setShareContext] = React.useState(true);

  // Auto-fill template when modal opens
  React.useEffect(() => {
    if (lawyer) {
      setMessage(`Hi ${lawyer.name},\n\nI need legal assistance regarding a matter related to ${lawyer.specialties[0].toLowerCase()}. Can we schedule a consultation?`);
      setSending(false);
    }
  }, [lawyer]);

  const handleSend = async () => {
    setSending(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    toast.success(`Message sent to ${lawyer?.name}!`);
    onClose();
  };

  if (!lawyer) return null;

  return (
    <Dialog open={!!lawyer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact {lawyer.name}</DialogTitle>
          <DialogDescription>
            Send a message to schedule a consultation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea 
              id="message" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-32 resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" /> Share AI Context
              </Label>
              <p className="text-xs text-muted-foreground">
                Attach your recent Nyaya AI chat history so the lawyer understands your case immediately.
              </p>
            </div>
            <Switch checked={shareContext} onCheckedChange={setShareContext} />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || !message.trim()} className="w-[120px]">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Ensure Search is imported from lucide-react if missed
import { Search } from 'lucide-react';
