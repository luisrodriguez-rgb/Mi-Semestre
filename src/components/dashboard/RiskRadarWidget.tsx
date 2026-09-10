'use client';

import Link from 'next/link';
import { Target, ChevronRight, ArrowRight } from 'lucide-react';
import { Subject } from '@/types';

interface RiskRadarWidgetProps {
  subjects?: Subject[];
}

interface RiskItem {
  id: string;
  name: string;
  status: 'CRÍTICO' | 'ATENCIÓN' | 'ESTABLE';
  details: string;
  statusColor: 'red' | 'amber' | 'green';
}

const DEFAULT_RISK_ITEMS: RiskItem[] = [
  {
    id: 'sub-calc',
    name: 'Cálculo Multivariado',
    status: 'CRÍTICO',
    details: 'Parcial en 4 días · 3 tareas · Asist. 90%',
    statusColor: 'red',
  },
  {
    id: 'sub-fisica',
    name: 'Física Mecánica',
    status: 'ATENCIÓN',
    details: 'Taller pendiente · Parcial en 12 días',
    statusColor: 'amber',
  },
  {
    id: 'sub-estructuras',
    name: 'Estructuras de Datos',
    status: 'ESTABLE',
    details: 'Todo al día · Asist. 95%',
    statusColor: 'green',
  },
  {
    id: 'sub-algebra',
    name: 'Álgebra Lineal',
    status: 'ESTABLE',
    details: 'Todo al día · Asist. 100%',
    statusColor: 'green',
  },
  {
    id: 'sub-ingles',
    name: 'Inglés Técnico',
    status: 'ESTABLE',
    details: 'Todo al día · Asist. 98%',
    statusColor: 'green',
  },
];

export function RiskRadarWidget({ subjects }: RiskRadarWidgetProps) {
  const items = DEFAULT_RISK_ITEMS;

  const getBadgeStyle = (statusColor: 'red' | 'amber' | 'green') => {
    switch (statusColor) {
      case 'red':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'amber':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'green':
      default:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    }
  };

  const getBarColor = (statusColor: 'red' | 'amber' | 'green') => {
    switch (statusColor) {
      case 'red':
        return 'bg-rose-500';
      case 'amber':
        return 'bg-amber-500';
      case 'green':
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors flex flex-col justify-between h-full">
      <div>
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
            <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
              Radar de Riesgo
            </h3>
          </div>
          <Link
            href="/radar"
            className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-0.5"
          >
            <span>Ver detalle</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Lista de Materias con Indicador Vertical */}
        <div className="mt-3.5 space-y-2.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href="/radar"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Barra vertical indicadora */}
                <div className={`w-1 h-8 rounded-full shrink-0 ${getBarColor(item.statusColor)}`} />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0f1330] dark:text-white group-hover:text-[#3b43a8] dark:group-hover:text-[#8e98ec] transition-colors truncate">
                      {item.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full border ${getBadgeStyle(
                        item.statusColor
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#626c96] dark:text-[#8b95c2] mt-0.5 truncate font-mono">
                    {item.details}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#a0a8d6] group-hover:text-[#3b43a8] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>

      {/* Síntesis de Salud del Semestre */}
      <div className="mt-4 p-3 rounded-xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e6f2] dark:border-[#1c224b] flex items-center justify-between text-xs">
        <div>
          <div className="font-bold text-[#0f1330] dark:text-white">
            Salud del semestre
          </div>
          <div className="text-[11px] text-[#626c96] dark:text-[#8b95c2] mt-0.5">
            5 materias · 2 requieren atención
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          Atención
        </span>
      </div>
    </div>
  );
}
