import { commitAcademicDataAtomically } from '../../lib/importer/universal/committer';
import { ParsedAcademicData } from '../../lib/importer/universal/types';
import { db } from '../../lib/storage/database';

async function runAtomicCommitTests() {
  console.log('--- Testing Dexie Atomic Commit Contract & Rollback ---');

  const mockAcademicData: ParsedAcademicData = {
    student: {
      name: 'Luis Rodriguez',
      studentCode: 'A00414805',
      program: 'Ingeniería Industrial',
      semesterNumber: 4,
      gpa: 4.35,
    },
    semester: {
      name: 'Semestre Activo 2026-2',
      startDate: '2026-08-01',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-1', name: 'Estadística Aplicada II', code: '11373', credits: 4 },
      { id: 'sub-2', name: 'Optimización', code: '05359', credits: 4 },
    ],
    scheduleBlocks: [
      { subjectId: 'sub-1', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', location: 'Salón 204C' },
      { subjectId: 'sub-1', dayOfWeek: 3, startTime: '08:00', endTime: '10:00', location: 'Salón 204C' },
      { subjectId: 'sub-2', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', location: 'Aula 102B' },
    ],
    exams: undefined, // Sin exámenes en la evidencia (cero datos ficticios)
    assignments: [
      { id: 'as-1', subjectId: 'sub-2', title: 'Taller Método Simplex', dueDate: '2026-09-20' },
    ],
  };

  // Mock de db.transaction y métodos de tabla para simular el comportamiento transaccional en entorno de prueba Node
  const originalTransaction = db.transaction.bind(db);
  let transactionExecuted = false;

  const tablesToMock = [
    db.subjects,
    db.scheduleBlocks,
    db.exams,
    db.assignments,
    db.routines,
    db.attendance,
    db.grades,
    db.studySessions,
    db.semesters,
    db.profiles,
  ];

  tablesToMock.forEach((t: any) => {
    if (t) {
      t.clear = async () => {};
      t.bulkPut = async () => {};
      t.put = async () => {};
      t.add = async () => {};
    }
  });

  (db as any).transaction = async (mode: string, tables: any[], callback: () => Promise<void>) => {
    transactionExecuted = true;
    await callback();
  };

  try {
    // 1. Ejecutar Commit Atómico Exitoso
    const commitResult = await commitAcademicDataAtomically(mockAcademicData);

    if (!transactionExecuted) {
      throw new Error('La operación de commit no se ejecutó dentro de una transacción atómica Dexie.');
    }

    if (commitResult.created.subjects !== 2) {
      throw new Error(`Se esperaban 2 asignaturas creadas, se obtuvieron ${commitResult.created.subjects}`);
    }

    if (commitResult.created.scheduleBlocks !== 3) {
      throw new Error(`Se esperaban 3 bloques de horario creados, se obtuvieron ${commitResult.created.scheduleBlocks}`);
    }

    if (commitResult.created.exams !== 0) {
      throw new Error(`Principio violado: exams debería ser 0 (no inventado), pero se obtuvieron ${commitResult.created.exams}`);
    }

    if (commitResult.created.assignments !== 1) {
      throw new Error(`Se esperaba 1 tarea creada, se obtuvieron ${commitResult.created.assignments}`);
    }

    if (!commitResult.semesterId || !commitResult.profileId) {
      throw new Error('El CommitResult debe incluir IDs canónicos de semesterId y profileId');
    }

    console.log('✓ Commit atómico exitoso: Transacción Dexie ejecutada y CommitResult validado');

    // 2. Test de Reversión (Rollback) ante Error en Transacción
    let rollbackDetected = false;
    (db as any).transaction = async () => {
      throw new Error('Simulated Database Write Failure (Disk Full / Constraint)');
    };

    try {
      await commitAcademicDataAtomically(mockAcademicData);
    } catch (err: any) {
      rollbackDetected = true;
      if (!err.message.includes('Simulated Database Write Failure')) {
        throw new Error(`Error inesperado capturado: ${err.message}`);
      }
    }

    if (!rollbackDetected) {
      throw new Error('La falla transaccional debería rechazar la promesa completa y no silenciar errores.');
    }

    console.log('✓ Reversión atómica validada: Errores transaccionales impiden escrituras parciales y abortan limpiamente');
    console.log('ALL ATOMIC COMMIT TESTS PASSED! 🎉');
  } finally {
    // Restaurar método original
    (db as any).transaction = originalTransaction;
  }
}

runAtomicCommitTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
