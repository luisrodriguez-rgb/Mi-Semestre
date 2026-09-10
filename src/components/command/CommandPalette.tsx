'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import {
  Sparkles,
  Calendar,
  Plus,
  Clock,
  User,
  Search,
  CheckCircle2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    toggleCommandPalette,
    openInbox,
    openCalendarModal,
    openAddTask,
    openAddExam,
    openRoutineModal,
    openProfile,
  } = useUIStore();

  const [query, setQuery] = useState('');

  // Atajo global ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        closeCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, toggleCommandPalette, closeCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    {
      id: 'inbox',
      title: 'Abrir Buzón Inteligente',
      subtitle: 'Pega mensajes de WhatsApp, apuntes de notas o avisos',
      icon: Sparkles,
      color: 'text-indigo-500 bg-indigo-500/10',
      action: () => { closeCommandPalette(); openInbox(); },
    },
    {
      id: 'calendar',
      title: 'Sincronizar Calendario (.ICS, Google, Outlook)',
      subtitle: 'Importa tus clases desde calendarios externos o descarga .ics',
      icon: Calendar,
      color: 'text-[#3b3abf] bg-[#3b3abf]/10',
      action: () => { closeCommandPalette(); openCalendarModal(); },
    },
    {
      id: 'task',
      title: 'Nueva Tarea o Entrega',
      subtitle: 'Registra un taller, entregable o proyecto',
      icon: Plus,
      color: 'text-blue-500 bg-blue-500/10',
      action: () => { closeCommandPalette(); openAddTask(); },
    },
    {
      id: 'exam',
      title: 'Nuevo Parcial o Evaluación',
      subtitle: 'Agrega un examen con ponderación porcentual',
      icon: CheckCircle2,
      color: 'text-amber-500 bg-amber-500/10',
      action: () => { closeCommandPalette(); openAddExam(); },
    },
    {
      id: 'routine',
      title: 'Añadir Bloque Personal',
      subtitle: 'Almuerzo, gimnasio, traslados o tiempo de estudio fijo',
      icon: Clock,
      color: 'text-emerald-500 bg-emerald-500/10',
      action: () => { closeCommandPalette(); openRoutineModal(); },
    },
    {
      id: 'profile',
      title: 'Mi Perfil y Configuración',
      subtitle: 'Edita tus datos académicos o sincroniza con Supabase',
      icon: User,
      color: 'text-purple-500 bg-purple-500/10',
      action: () => { closeCommandPalette(); openProfile(); },
    },
    {
      id: 'nav-schedule',
      title: 'Ir a Horario Semanal',
      subtitle: 'Ver la cuadrícula de clases y huecos libres',
      icon: BookOpen,
      color: 'text-cyan-500 bg-cyan-500/10',
      action: () => { closeCommandPalette(); router.push('/schedule'); },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Barra de Búsqueda */}
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--paper)]">
          <Search className="w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe un comando o busca una acción..."
            className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-[var(--surface)] px-2 py-0.5 rounded-lg border border-[var(--border)] text-[var(--muted)]">
            ESC
          </kbd>
        </div>

        {/* Lista de Acciones */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">
              No se encontraron acciones para &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className="p-3 rounded-2xl hover:bg-[var(--paper)] flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--ink)] block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-[var(--muted)] block">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--paper)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
          <span>Mi Semestre Intelligence</span>
          <span>Navega con ⌘K o flechas</span>
        </div>
      </div>
    </div>
  );
}
