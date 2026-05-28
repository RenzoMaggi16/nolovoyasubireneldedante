'use client';

import { useEffect, useState } from 'react';
import { Wifi, Clock as ClockIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showStatus?: boolean;
}

export function Header({ title, subtitle, showStatus = true }: HeaderProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display text-white tracking-tight uppercase italic">
            {title}
          </h1>
          {showStatus && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-md">
              <motion.div 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-green-500" 
              />
              <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Live</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 self-end md:self-auto">
        <div className="flex items-center gap-2 text-white/40">
          <Wifi size={16} className="text-green-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Sistema en línea</span>
        </div>
        <div className="flex items-center gap-2 text-white/80 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          <ClockIcon size={16} className="text-white/40" />
          <span className="text-sm font-mono font-bold">{time}</span>
        </div>
      </div>
    </header>
  );
}
