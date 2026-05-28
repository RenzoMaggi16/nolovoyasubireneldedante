'use client';

import { motion } from 'framer-motion';
import { cn } from '@/hooks/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn(
        'bg-white/5',
        variant === 'rectangular' && 'rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 w-full rounded',
        className
      )}
    />
  );
}

export function PlatformCardSkeleton() {
  return (
    <div className="bg-surface-base border border-white/5 rounded-2xl p-6 h-[220px]">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="w-10 h-10" />
          <Skeleton variant="text" className="w-24 h-6" />
        </div>
        <Skeleton variant="rectangular" className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-40 h-4 mb-6" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton variant="rectangular" className="h-16 rounded-xl" />
        <Skeleton variant="rectangular" className="h-16 rounded-xl" />
        <Skeleton variant="rectangular" className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-surface-elevated border border-white/5 rounded-xl p-4 mb-4">
      <div className="flex justify-between mb-4">
        <Skeleton variant="text" className="w-20 h-5" />
        <Skeleton variant="rectangular" className="w-24 h-6 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-full h-4 mb-2" />
      <Skeleton variant="text" className="w-3/4 h-4 mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="w-16 h-6" />
        <div className="flex gap-2">
          <Skeleton variant="circular" className="w-8 h-8" />
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}
