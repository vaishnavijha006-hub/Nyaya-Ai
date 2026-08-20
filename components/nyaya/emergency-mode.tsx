'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, MapPin, Phone, Lock, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EmergencyModeProps {
  onSafe: () => void;
}

export function EmergencyMode({ onSafe }: EmergencyModeProps) {
  const [view, setView] = React.useState<'main' | 'nearby' | 'contacts'>('main');
  const [nearbyHelp, setNearbyHelp] = React.useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = React.useState(false);

  // Quick Exit via Esc key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        quickExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickExit = () => {
    window.location.replace('https://weather.com');
  };

  const getImmediateHelp = () => {
    window.location.href = 'tel:112'; // National Emergency Number in India
  };

  const findNearbyHelp = () => {
    setView('nearby');
    setLoadingNearby(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Mock backend call for now, assume endpoint exists or will be added
            const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
            const res = await fetch(`${API_URL}/api/emergency/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
            if (res.ok) {
              const data = await res.json();
              setNearbyHelp(data.resources || []);
            } else {
              // Mock fallback
              setNearbyHelp([
                { name: 'Local Police Station', distance: '1.2 km', phone: '100' },
                { name: 'Women Helpline', distance: 'N/A', phone: '1091' },
                { name: 'City Hospital', distance: '2.5 km', phone: '102' }
              ]);
            }
          } catch (e) {
            setNearbyHelp([
              { name: 'Local Police Station', distance: '1.2 km', phone: '100' },
              { name: 'Women Helpline', distance: 'N/A', phone: '1091' },
            ]);
          } finally {
            setLoadingNearby(false);
          }
        },
        (error) => {
          toast.error('Location access denied. Cannot find nearby help automatically.');
          setLoadingNearby(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
      setLoadingNearby(false);
    }
  };

  const TrustedContactsUI = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setView('main')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h3 className="text-xl font-bold text-white">Trusted Contacts</h3>
      <div className="rounded-xl bg-white/10 p-4">
        <p className="text-sm text-red-100 mb-4">You have no trusted contacts configured yet.</p>
        <Button className="w-full bg-white text-red-600 hover:bg-gray-100">Add New Contact</Button>
      </div>
    </div>
  );

  const NearbyHelpUI = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setView('main')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h3 className="text-xl font-bold text-white">Nearby Help</h3>
      {loadingNearby ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : (
        <div className="space-y-3">
          {nearbyHelp.map((help, idx) => (
            <div key={idx} className="flex justify-between items-center rounded-xl bg-white/10 p-4">
              <div>
                <p className="font-bold text-white">{help.name}</p>
                <p className="text-sm text-red-100">{help.distance}</p>
              </div>
              <a href={`tel:${help.phone}`} className="flex items-center rounded-lg bg-white px-4 py-2 font-bold text-red-600">
                <Phone className="mr-2 h-4 w-4" /> Call
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full bg-red-600 p-6 sm:p-8 rounded-2xl shadow-2xl overflow-y-auto"
    >
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-10 w-10 text-white" />
          <h2 className="text-3xl font-black text-white uppercase tracking-wider">Emergency Mode</h2>
        </div>
        <Button 
          variant="destructive" 
          onClick={quickExit}
          className="bg-black text-white hover:bg-gray-900 border-2 border-transparent focus:border-white font-bold"
        >
          <Lock className="mr-2 h-4 w-4" /> QUICK EXIT (ESC)
        </Button>
      </div>

      <div className="flex-1 w-full max-w-md mx-auto">
        {view === 'main' && (
          <div className="space-y-4 flex flex-col mt-4">
            <Button 
              size="lg" 
              className="w-full h-16 text-lg font-bold bg-white text-red-600 hover:bg-gray-100 shadow-lg"
              onClick={getImmediateHelp}
            >
              <Phone className="mr-3 h-6 w-6" /> 🆘 GET IMMEDIATE HELP
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="w-full h-14 text-md font-bold border-white text-white hover:bg-white/20 hover:text-white"
              onClick={findNearbyHelp}
            >
              <MapPin className="mr-2 h-5 w-5" /> 📍 FIND NEARBY HELP
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="w-full h-14 text-md font-bold border-white text-white hover:bg-white/20 hover:text-white"
              onClick={() => setView('contacts')}
            >
              <Phone className="mr-2 h-5 w-5" /> 👤 CONTACT TRUSTED PERSON
            </Button>

            <Button 
              size="lg" 
              className="w-full h-14 text-md font-bold bg-black text-white hover:bg-gray-900 mt-8"
              onClick={onSafe}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" /> I'M SAFE NOW
            </Button>
          </div>
        )}
        
        {view === 'nearby' && <NearbyHelpUI />}
        {view === 'contacts' && <TrustedContactsUI />}
      </div>
    </motion.div>
  );
}
