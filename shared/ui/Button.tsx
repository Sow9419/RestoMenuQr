import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles with 44px min touch target on md/lg sizes
          'inline-flex items-center justify-center transition-all duration-150 font-sans font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 gap-2 cursor-pointer',
          
          // Variants
          variant === 'primary' && 'bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-hover)] text-white rounded-lg shadow-sm',
          variant === 'secondary' && 'bg-surface hover:bg-raised text-text-primary rounded-lg border border-[color:var(--color-border-custom)] shadow-sm',
          variant === 'ghost' && 'bg-transparent hover:bg-surface text-text-secondary hover:text-text-primary rounded-lg',
          variant === 'danger' && 'bg-error hover:bg-red-700 text-white rounded-lg shadow-sm',
          
          // Size scales (Guarantee min-target 44px `h-11` except for micro-sizing)
          size === 'sm' && 'h-9 px-3.5 text-xs rounded-md',
          size === 'md' && 'h-11 px-5 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
