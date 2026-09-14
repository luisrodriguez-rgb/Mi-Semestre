import { ParsedScheduleBlock } from './types';
import { DayOfWeek } from '@/types';

export function areScheduleBlocksEquivalent(
  blockA: ParsedScheduleBlock,
  blockB: ParsedScheduleBlock
): boolean {
  // Mismo día
  if (blockA.dayOfWeek !== blockB.dayOfWeek) {
    return false;
  }

  // Misma materia (si ya fueron resueltas al mismo ID)
  if (blockA.subjectId !== blockB.subjectId) {
    return false;
  }

  // Horas equivalentes (tolerancia de formato "08:00" vs "8:00")
  const normAStart = blockA.startTime.padStart(5, '0');
  const normBStart = blockB.startTime.padStart(5, '0');
  const normAEnd = blockA.endTime.padStart(5, '0');
  const normBEnd = blockB.endTime.padStart(5, '0');

  return normAStart === normBStart && normAEnd === normBEnd;
}

function selectBetterLocation(locA?: string, locB?: string): string | undefined {
  if (!locA) return locB;
  if (!locB) return locA;

  const isGeneric = (loc: string) => /^(aula campus|campus|por definir|tba|sin asignar)$/i.test(loc.trim());
  if (isGeneric(locA) && !isGeneric(locB)) return locB;
  if (!isGeneric(locA) && isGeneric(locB)) return locA;

  return locB.length > locA.length ? locB : locA;
}

export function mergeScheduleBlockData(
  existingBlock: ParsedScheduleBlock,
  incomingBlock: ParsedScheduleBlock
): ParsedScheduleBlock {
  return {
    ...existingBlock,
    location: selectBetterLocation(existingBlock.location, incomingBlock.location),
    evidence: [...(existingBlock.evidence || []), ...(incomingBlock.evidence || [])],
  };
}
