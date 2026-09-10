'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  icon?: React.ComponentType<{ className?: string }>;
  id?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  icon: LeadingIcon,
  id,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const isFullWidth = className.includes('w-full') || buttonClassName.includes('w-full');

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const SelectedOptionIcon = selectedOption?.icon;

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullWidth ? 'block w-full' : 'inline-block'} text-left ${className}`}
      id={selectId}
    >
      {/* Botón Disparador */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isFullWidth ? 'flex w-full' : 'inline-flex'
        } items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[#3b3abf]/60 text-xs font-semibold text-[var(--ink)] shadow-2xs transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#3b3abf]/20 ${
          isOpen ? 'border-[#3b3abf] ring-2 ring-[#3b3abf]/20' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {LeadingIcon && (
            <LeadingIcon className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff] shrink-0" />
          )}
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/20"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {SelectedOptionIcon && (
            <SelectedOptionIcon className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          {selectedOption?.sublabel && (
            <span className="text-[10px] font-mono text-[var(--muted)] shrink-0">
              ({selectedOption.sublabel})
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--muted)] shrink-0 transition-transform duration-200 ml-1 ${
            isOpen ? 'rotate-180 text-[#3b3abf]' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable con Estilo Editorial de Alta Gama */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 ${
            isFullWidth ? 'w-full min-w-full' : 'min-w-[230px] w-max max-w-md'
          } rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl shadow-[#10103e]/10 dark:shadow-black/50 p-1.5 text-xs text-[var(--ink)] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
          role="listbox"
        >
          <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              const OptionIcon = option.icon;

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] font-bold shadow-2xs'
                      : 'hover:bg-[var(--paper)] text-[var(--ink)] hover:text-[#3b3abf] dark:hover:text-[#a0a0ff]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                    {option.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {OptionIcon && (
                      <OptionIcon className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-[10px] font-mono text-[var(--muted)] shrink-0">
                        ({option.sublabel})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[var(--paper)] text-[var(--muted)] border border-[var(--border)]">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff] stroke-[2.5]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
