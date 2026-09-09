import { create } from 'zustand';

interface FocusSessionState {
  isActive: boolean;
  taskTitle: string;
  subjectName?: string;
  totalMinutes: number;
  secondsRemaining: number;
  isPaused: boolean;
}

interface UIState {
  isImporterOpen: boolean;
  isAddTaskOpen: boolean;
  isAddExamOpen: boolean;
  isAddClassOpen: boolean;
  activeSubjectDetailId: string | null;

  focusSession: FocusSessionState;

  openImporter: () => void;
  closeImporter: () => void;
  openAddTask: () => void;
  closeAddTask: () => void;
  openAddExam: () => void;
  closeAddExam: () => void;
  openAddClass: () => void;
  closeAddClass: () => void;
  setActiveSubjectDetailId: (id: string | null) => void;

  startFocusSession: (taskTitle: string, subjectName: string, minutes: number) => void;
  tickFocusSession: () => void;
  togglePauseFocus: () => void;
  stopFocusSession: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isImporterOpen: false,
  isAddTaskOpen: false,
  isAddExamOpen: false,
  isAddClassOpen: false,
  activeSubjectDetailId: null,

  focusSession: {
    isActive: false,
    taskTitle: '',
    subjectName: '',
    totalMinutes: 25,
    secondsRemaining: 25 * 60,
    isPaused: false,
  },

  openImporter: () => set({ isImporterOpen: true }),
  closeImporter: () => set({ isImporterOpen: false }),
  openAddTask: () => set({ isAddTaskOpen: true }),
  closeAddTask: () => set({ isAddTaskOpen: false }),
  openAddExam: () => set({ isAddExamOpen: true }),
  closeAddExam: () => set({ isAddExamOpen: false }),
  openAddClass: () => set({ isAddClassOpen: true }),
  closeAddClass: () => set({ isAddClassOpen: false }),
  setActiveSubjectDetailId: (id) => set({ activeSubjectDetailId: id }),

  startFocusSession: (taskTitle, subjectName, minutes) =>
    set({
      focusSession: {
        isActive: true,
        taskTitle,
        subjectName,
        totalMinutes: minutes,
        secondsRemaining: Math.max(60, minutes * 60),
        isPaused: false,
      },
    }),

  tickFocusSession: () =>
    set((state) => {
      if (!state.focusSession.isActive || state.focusSession.isPaused) return state;
      if (state.focusSession.secondsRemaining <= 1) {
        return {
          focusSession: {
            ...state.focusSession,
            secondsRemaining: 0,
            isActive: false,
          },
        };
      }
      return {
        focusSession: {
          ...state.focusSession,
          secondsRemaining: state.focusSession.secondsRemaining - 1,
        },
      };
    }),

  togglePauseFocus: () =>
    set((state) => ({
      focusSession: {
        ...state.focusSession,
        isPaused: !state.focusSession.isPaused,
      },
    })),

  stopFocusSession: () =>
    set((state) => ({
      focusSession: {
        ...state.focusSession,
        isActive: false,
      },
    })),
}));
