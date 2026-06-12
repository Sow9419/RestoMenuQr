import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-150',
          hoverable && 'hover:shadow-md hover:border-border-custom hover:translate-y-[-1px]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-playfair font-semibold text-lg text-text-primary tracking-tight', className)} {...props}>
    {children}
  </h3>
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = ({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('font-sans text-xs text-text-secondary leading-normal', className)} {...props}>
    {children}
  </p>
);

CardDescription.displayName = 'CardDescription';

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('pt-0', className)} {...props}>
    {children}
  </div>
);

CardContent.displayName = 'CardContent';

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center pt-4 border-t border-stone-100 mt-4', className)} {...props}>
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';
