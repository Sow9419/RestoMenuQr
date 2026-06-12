'use client';

import React from 'react';
import { useUIStore, Toast } from '@/shared/store/uiStore';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((item: Toast) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto w-full flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white ${
              item.type === 'success' && 'border-emerald-100 text-emerald-900 bg-emerald-50/50'
            } ${
              item.type === 'error' && 'border-red-100 text-red-900 bg-red-50/50'
            } ${
              item.type === 'warning' && 'border-[#FCD34D] text-[#92400E] bg-amber-50/50'
            } ${
              item.type === 'info' && 'border-blue-100 text-blue-900 bg-blue-50/50'
            }`}
          >
            {/* Semantic Icon helper */}
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {item.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
              {item.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {item.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
            </div>

            {/* Content text */}
            <div className="flex-1 text-xs font-sans font-medium leading-relaxed">
              {item.message}
            </div>

            {/* Absolute close action with >=44px zone */}
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100/50 transition cursor-pointer"
              style={{ minWidth: 24, minHeight: 24 }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
