'use client';

import { useSemesterData } from '@/hooks/useSemesterData';
import { SemesterTimeline } from '@/components/timeline/SemesterTimeline';

export default function TimelinePage() {
  const { semester, subjectsMap, exams, assignments, isLoading } = useSemesterData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#3b3abf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SemesterTimeline
        semester={semester}
        subjectsMap={subjectsMap}
        exams={exams}
        assignments={assignments}
      />
    </div>
  );
}
