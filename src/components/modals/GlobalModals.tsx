'use client';

import dynamic from 'next/dynamic';

// Modales globales cargados bajo demanda en el cliente
const QuickScheduleImporterModal = dynamic(
  () => import('@/components/importer/QuickScheduleImporterModal').then((m) => m.QuickScheduleImporterModal),
  { ssr: false }
);
const AddTaskModal = dynamic(
  () => import('@/components/modals/AddTaskModal').then((m) => m.AddTaskModal),
  { ssr: false }
);
const AddExamModal = dynamic(
  () => import('@/components/modals/AddExamModal').then((m) => m.AddExamModal),
  { ssr: false }
);
const ProfileModal = dynamic(
  () => import('@/components/profile/ProfileModal').then((m) => m.ProfileModal),
  { ssr: false }
);
const FocusCompletionModal = dynamic(
  () => import('@/components/dashboard/FocusCompletionModal').then((m) => m.FocusCompletionModal),
  { ssr: false }
);
const EditClassModal = dynamic(
  () => import('@/components/modals/EditClassModal').then((m) => m.EditClassModal),
  { ssr: false }
);
const AttendanceModal = dynamic(
  () => import('@/components/modals/AttendanceModal').then((m) => m.AttendanceModal),
  { ssr: false }
);
const AddRoutineModal = dynamic(
  () => import('@/components/modals/AddRoutineModal').then((m) => m.AddRoutineModal),
  { ssr: false }
);
const SmartOnboardingModal = dynamic(
  () => import('@/components/modals/SmartOnboardingModal').then((m) => m.SmartOnboardingModal),
  { ssr: false }
);
const InboxModal = dynamic(
  () => import('@/components/inbox/InboxModal').then((m) => m.InboxModal),
  { ssr: false }
);
const CalendarImportModal = dynamic(
  () => import('@/components/calendar/CalendarImportModal').then((m) => m.CalendarImportModal),
  { ssr: false }
);
const CommandPalette = dynamic(
  () => import('@/components/command/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
);

export function GlobalModals() {
  return (
    <>
      <SmartOnboardingModal />
      <QuickScheduleImporterModal />
      <AddTaskModal />
      <AddExamModal />
      <ProfileModal />
      <FocusCompletionModal />
      <EditClassModal />
      <AttendanceModal />
      <AddRoutineModal />
      <InboxModal />
      <CalendarImportModal />
      <CommandPalette />
    </>
  );
}
