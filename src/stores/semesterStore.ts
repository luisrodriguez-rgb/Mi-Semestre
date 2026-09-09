import { create } from 'zustand';
import { DayOfWeek } from '@/types';

interface SemesterState {
  activeSemesterId: string | null;
  selectedDay: DayOfWeek;
  selectedWeek: number;
  filterSubjectId: string | null;
  showFreeSlotsOnly: boolean;

  setActiveSemesterId: (id: string | null) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setSelectedWeek: (week: number) => void;
  setFilterSubjectId: (id: string | null) => void;
  setShowFreeSlotsOnly: (show: boolean) => void;
}

// Obtener día de la semana actual (1 = Lun, 7 = Dom)
function getCurrentDayOfWeek(): DayOfWeek {
  const day = new Date().getDay();
  // getDay(): 0 = Dom, 1 = Lun, ... 6 = Sab
  if (day === 0) return 7;
  return day as DayOfWeek;
}

export const useSemesterStore = create<SemesterState>((set) => ({
  activeSemesterId: 'sem-2026-2',
  selectedDay: getCurrentDayOfWeek(),
  selectedWeek: 6,
  filterSubjectId: null,
  showFreeSlotsOnly: false,

  setActiveSemesterId: (id) => set({ activeSemesterId: id }),
  setSelectedDay: (day) => set({ selectedDay: day }),
  setSelectedWeek: (week) => set({ selectedWeek: week }),
  setFilterSubjectId: (id) => set({ filterSubjectId: id }),
  setShowFreeSlotsOnly: (show) => set({ showFreeSlotsOnly: show }),
}));
