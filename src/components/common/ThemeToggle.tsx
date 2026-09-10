'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'system';

function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (t === 'dark') {
    root.classList.add('dark');
  } else if (t === 'light') {
    root.classList.remove('dark');
  } else {
    // System
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = (localStorage.getItem('misemestre-theme') as Theme) || 'light';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const handleToggle = () => {
    let nextTheme: Theme = 'light';
    if (theme === 'light') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'system';
    else nextTheme = 'light';

    setTheme(nextTheme);
    localStorage.setItem('misemestre-theme', nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] ${className}`} />
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--paper)] text-[var(--ink)] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${className}`}
      title={`Tema: ${theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Sistema'}. Clic para cambiar.`}
      aria-label="Cambiar tema de color"
    >
      {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
      {theme === 'dark' && <Moon className="w-4 h-4 text-[#8888ff]" />}
      {theme === 'system' && <Monitor className="w-4 h-4 text-[var(--muted)]" />}
    </button>
  );
}
