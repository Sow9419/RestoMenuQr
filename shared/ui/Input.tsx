import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-text-secondary uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}
        
        <input
          id={id}
          ref={ref}
          type={type}
          className={cn(
            'w-full h-11 px-3.5 bg-stone-50 border rounded-xl text-text-primary text-sm transition-all focus:outline-none focus:bg-white placeholder-text-muted',
            error 
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/10' 
              : 'border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10',
            className
          )}
          {...props}
        />

        {error && (
          <span className="text-xs text-error font-medium mt-1">
            {error}
          </span>
        )}

        {helperText && !error && (
          <span className="text-xs text-text-muted mt-1 leading-normal">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
