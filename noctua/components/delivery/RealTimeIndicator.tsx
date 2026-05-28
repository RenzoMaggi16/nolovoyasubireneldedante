'use client';

import { motion } from 'framer-motion';

export function RealTimeIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.6, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-2 h-2 rounded-full bg-green-500"
      />
      <span className="text-[10px] font-bold text-green-500 tracking-wider uppercase">
        En Tiempo Real
      </span>
    </div>
  );
}
