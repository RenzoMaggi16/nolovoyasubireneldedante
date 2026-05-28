'use client';

import { Platform } from '../../types/platforms';
import { PlatformCard } from './PlatformCard';
import { motion } from 'framer-motion';

interface PlatformGridProps {
  platforms: Platform[];
  isLoading: boolean;
}

export function PlatformGrid({ platforms, isLoading }: PlatformGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-base border border-white/5 rounded-2xl p-6 h-[220px] animate-pulse">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="h-6 w-24 bg-white/5 rounded" />
              </div>
            </div>
            <div className="h-4 w-40 bg-white/5 rounded mb-6" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-white/5 rounded-xl" />
              <div className="h-16 bg-white/5 rounded-xl" />
              <div className="h-16 bg-white/5 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {platforms.map((platform, index) => (
        <PlatformCard key={platform.id} platform={platform} index={index} />
      ))}
    </motion.div>
  );
}
