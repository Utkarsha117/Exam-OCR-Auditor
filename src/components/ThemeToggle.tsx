import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const themes = [
  { id: 'light', name: 'Light', color: '#ffffff', textColor: '#1e293b' },
  { id: 'dark', name: 'Dark', color: '#1e293b', textColor: '#ffffff' },
  { id: 'midnight', name: 'Midnight', color: '#050505', textColor: '#ffffff' },
  { id: 'emerald', name: 'Emerald', color: '#020617', textColor: '#ffffff' },
  { id: 'rose', name: 'Rose', color: '#09090b', textColor: '#ffffff' },
  { id: 'ocean', name: 'Ocean', color: '#081217', textColor: '#ffffff' },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white/40 hover:bg-white/5 rounded-full transition-colors flex items-center justify-center"
        title="Change Theme"
      >
        <Palette size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute right-0 mt-2 w-48 bg-brand-surface border border-white/10 rounded-2xl p-2 shadow-2xl z-[70]"
            >
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 py-2">Select Aesthetic</p>
              <div className="grid grid-cols-1 gap-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                      theme === t.id ? "bg-white/5 text-white" : "text-white/40 hover:bg-white/[0.02] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border border-white/10 shadow-sm"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </div>
                    {theme === t.id && <Check size={14} className="text-brand-primary" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
