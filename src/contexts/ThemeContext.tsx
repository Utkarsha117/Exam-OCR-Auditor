import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'emerald' | 'rose' | 'ocean' | 'midnight' | 'cyber' | 'safe' | 'swiss' | 'mono';
type FontSize = 'sm' | 'base' | 'lg';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('app-theme') as Theme) || 'safe');
  const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem('app-font-size') as FontSize) || 'base');
  const [compactMode, setCompactMode] = useState<boolean>(() => localStorage.getItem('app-compact') === 'true');
  const [accentColor, setAccentColor] = useState<string>(() => localStorage.getItem('app-accent') || '#00a6bb'); // Default safe teal

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-emerald', 'theme-rose', 'theme-ocean', 'theme-midnight', 'theme-cyber', 'theme-safe', 'theme-swiss', 'theme-mono');
    root.classList.add(`theme-${theme}`);
    
    const isLightTheme = ['light', 'safe', 'swiss', 'mono'].includes(theme);
    if (isLightTheme) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-font-size', fontSize);
    const root = window.document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    root.style.fontSize = fontSize === 'sm' ? '14px' : fontSize === 'lg' ? '18px' : '16px';
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('app-compact', String(compactMode));
    if (compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem('app-accent', accentColor);
    document.documentElement.style.setProperty('--brand-primary', accentColor);
    // Also set a muted version for backgrounds
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    document.documentElement.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`);
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, 
      fontSize, setFontSize, 
      compactMode, setCompactMode,
      accentColor, setAccentColor 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
