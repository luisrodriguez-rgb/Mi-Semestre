import {
  computeAcademicFingerprint,
  resolveBlockDeduplication,
} from '../../lib/importer/deduplication';
import { ScheduleBlock } from '../../types';

function testDeduplication() {
  console.log('--- Testing Deduplication & Fingerprinting ---');

  // 1. Test fingerprints
  const fp1 = computeAcademicFingerprint('Estadística II', 1, '10:00', '12:00', 'Salón 301');
  const fp2 = computeAcademicFingerprint('estadistica ii', 1, '10:00', '12:00', 'salon 301');
  if (fp1 !== fp2) {
    throw new Error(`Academic fingerprints do not match for normalized strings: ${fp1} vs ${fp2}`);
  }
  console.log('✓ Academic fingerprint normalizes casing and accents correctly');

  // 2. Test Deduplication resolution: duplicate detection
  const existing: ScheduleBlock[] = [
    {
      id: 'block-1',
      subjectId: 'sub-est',
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '12:00',
      location: 'Salón 301',
      externalUid: 'uid-123',
      source: 'ics',
      academicFingerprint: fp1,
    },
  ];

  const subjectsMap = {
    'sub-est': { id: 'sub-est', name: 'Estadística II', code: 'EST101' },
  };

  const candidateSame = {
    subjectId: 'sub-est',
    subjectNameOrCode: 'Estadística II EST101',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '12:00',
    location: 'Salón 301',
    externalUid: 'uid-123',
    source: 'ics' as const,
  };

  const resSame = resolveBlockDeduplication(candidateSame, existing, subjectsMap);
  if (resSame.action !== 'skip') {
    throw new Error(`Expected 'skip' for exact duplicate, got '${resSame.action}'`);
  }
  console.log('✓ Exact duplicate skipped successfully');

  // 3. Test Room Change Update
  const candidateRoomChange = {
    subjectId: 'sub-est',
    subjectNameOrCode: 'Estadística II EST101',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '12:00',
    location: 'Salón 402',
    externalUid: 'uid-123',
    source: 'ics' as const,
  };

  const resUpdate = resolveBlockDeduplication(candidateRoomChange, existing, subjectsMap);
  if (resUpdate.action !== 'update' || resUpdate.diff?.location?.new !== 'Salón 402') {
    throw new Error(`Expected 'update' for room change, got '${resUpdate.action}'`);
  }
  console.log('✓ Room change detected and marked for update successfully');

  // 4. Test New Block
  const candidateNew = {
    subjectId: 'sub-est',
    subjectNameOrCode: 'Estadística II EST101',
    dayOfWeek: 3,
    startTime: '14:00',
    endTime: '16:00',
    location: 'Salón 102',
    externalUid: 'uid-456',
    source: 'ics' as const,
  };

  const resNew = resolveBlockDeduplication(candidateNew, existing, subjectsMap);
  if (resNew.action !== 'create') {
    throw new Error(`Expected 'create' for new block, got '${resNew.action}'`);
  }
  console.log('✓ New block correctly marked for creation');

  console.log('ALL DEDUPLICATION TESTS PASSED SUCCESSFULLY!\n');
}

testDeduplication();
