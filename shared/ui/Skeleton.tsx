import React, { HTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className, variant = 'rect', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-stone-200/80 dark:bg-stone-800/80',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'rect' && 'rounded-xl',
        variant === 'circle' && 'rounded-full h-12 w-12 shrink-0',
        className
      )}
      {...props}
    />
  );
}
