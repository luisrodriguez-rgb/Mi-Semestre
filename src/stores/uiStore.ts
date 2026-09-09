import { create } from 'zustand';

export interface FocusSessionState {
  isActive: boolean;
  taskId?: string;
  taskTitle: string;
  subjectName?: string;
  totalMinutes: number;
  secondsRemaining: number;
  isPaused: boolean;
}

export interface FocusCompletionData {
  taskId?: string;
  taskTitle: string;
  subjectName?: string;
  minutesPlanned: number;
  minutesElapsed: number;
}

interface UIState {
  isImporterOpen: boolean;
  isAddTaskOpen: boolean;
  isAddExamOpen: boolean;
  isAddClassOpen: boolean;
  isProfileOpen: boolean;
  isFocusCompletionOpen: boolean;
  activeSubjectDetailId: string | null;

  focusSession: FocusSessionState;
  focusCompletionData: FocusCompletionData | null;

  openImporter: () => void;
  closeImporter: () => void;
  openAddTask: () => void;
  closeAddTask: () => void;
  openAddExam: () => void;
  closeAddExam: () => void;
  openAddClass: () => void;
  closeAddClass: () => void;
  openProfile: () => void;
  closeProfile: () => void;
  setActiveSubjectDetailId: (id: string | null) => void;

  startFocusSession: (
    taskTitle: string,
    subjectName: string,
    minutes: number,
    taskId?: string
  ) => void;
  tickFocusSession: () => void;
  togglePauseFocus: () => void;
  stopFocusSession: () => void;

  openFocusCompletion: (data: FocusCompletionData) => void;
  closeFocusCompletion: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isImporterOpen: false,
  isAddTaskOpen: false,
  isAddExamOpen: false,
  isAddClassOpen: false,
  isProfileOpen: false,
  isFocusCompletionOpen: false,
  activeSubjectDetailId: null,

  focusSession: {
    isActive: false,
    taskId: undefined,
    taskTitle: '',
    subjectName: '',
    totalMinutes: 25,
    secondsRemaining: 25 * 60,
    isPaused: false,
  },
  focusCompletionData: null,

  openImporter: () => set({ isImporterOpen: true }),
  closeImporter: () => set({ isImporterOpen: false }),
  openAddTask: () => set({ isAddTaskOpen: true }),
  closeAddTask: () => set({ isAddTaskOpen: false }),
  openAddExam: () => set({ isAddExamOpen: true }),
  closeAddExam: () => set({ isAddExamOpen: false }),
  openAddClass: () => set({ isAddClassOpen: true }),
  closeAddClass: () => set({ isAddClassOpen: false }),
  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false }),
  setActiveSubjectDetailId: (id) => set({ activeSubjectDetailId: id }),

  startFocusSession: (taskTitle, subjectName, minutes, taskId) =>
    set({
      focusSession: {
        isActive: true,
        taskId,
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

  openFocusCompletion: (data) =>
    set({
      isFocusCompletionOpen: true,
      focusCompletionData: data,
    }),

  closeFocusCompletion: () =>
    set({
      isFocusCompletionOpen: false,
      focusCompletionData: null,
    }),
}));
