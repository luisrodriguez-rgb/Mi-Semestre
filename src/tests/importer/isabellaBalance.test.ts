import { parseJasperAcademicBalance } from '../../lib/importer/smartAcademicIngester';

function testIsabellaBalanceParsing() {
  console.log('--- Testing Isabella Palomino Real 3-Page Balance Parsing ---');

  const sampleBalance = `
sep 27, 2026 1:43:17 PM
SISTEMA DE REGISTRO ACADÉMICO
Balance académico
RRBANBALACA - JASPER 1097497195 Página 1 de 3

Estudiante: A00414870 - PALOMINO ORTEGA ISABELLA
Semestre: 4 Cohorte: 202510 Promedio: 4.5
Programa: ENI - Economía Y Negocios Internacionales

Materias por aprobar
No. Eliminar Código Materia Semestre
1 IDI 07203 Tercer Idioma III 00
2 IDI 07204 Tercer Idioma IV 00
3 HUM 02878 Humanidades, artes y ciencias 02
4 ECO 06311 Pensamiento y contexto económico II 04
5 MAT 08319 Formación cuantitativa III 04
6 ECO 06305 Microeconomía y competencia II 04
7 FIN 04285 Finanzas empresariales I 04
8 ECO 06288 Business analytics II 04
9 GES 01393 Liderazgo y desarrollo de personas 05
10 CDI 42002 Manejo de información y datos II 05
11 ECO 06299 Macroeconomía y productividad III 05
12 FIN 04286 Finanzas empresariales II 05
13 ECO 06289 Business analytics III 05
14 ECO 06306 Microeconomía y competencia III 05
15 PDP 00101 Programa de desarrollo profesional I 06
16 ECO 06290 Business analytics IV 06
17 ECO 06307 Microeconomía y competencia IV 06
18 MER 03296 Global business III 06
19 GES 01387 Estrategia competitiva 06
20 ECO 06300 Macroeconomía y productividad IV 06
21 ECO 06312 Pensamiento y contexto económico III 06
22 PDP 00132 Programa de desarrollo profesional II 07
23 HUM 02875 Ciudadanía III 07
24 ECO 06308 Microeconomía y competencia V 07
25 CLI 19017 Examen Saber PRO 07
26 MER 03297 Global business IV 07
27 MER 03279 Desarrollo de negocios sostenibles 07
28 ECO 06291 Electiva de exploración y profundización 07
29 PDP 00134 Práctica profesional 08

Materias matriculadas
No. Período Código NRC Materia
1 202620 08322 11805 Economía matemática
2 202620 04258 11602 Contabilidad gerencial
3 202620 06326 11950 Estadística para la toma de decisiones
4 202620 06311 11961 Pensamiento y contexto económico II
5 202620 06302 11959 Comportamiento de las firmas y el consumidor
6 202620 02810 12485 Recordar y olvidar: identidad, cultura y comunicación
7 202620 40074 12027 Hip Hop: cultura, industria y territorio

Materias cursadas
No. Período Código Grupo Materia Cred. Forma Tipo electiva Mod. Nota
1 07001 Inglés I EQ Aprobado
2 07002 Inglés II EQ Aprobado
3 07003 Inglés III EQ Aprobado
4 07004 Inglés IV EQ Aprobado
5 07005 Inglés V EQ Aprobado
6 07006 Inglés VI EQ Aprobado
7 07007 Inglés VII EQ Aprobado
8 07008 Inglés VIII EQ Aprobado
9 202515 09640 004 Habilidades básicas en computación 0 Aprobado
10 202510 01302 023 Organizaciones 2 4.7
35 202610 08321 005 Matemática avanzada para los negocios 4 4.5
  `;

  const parsed = parseJasperAcademicBalance(sampleBalance);
  if (!parsed) {
    throw new Error('Fallo al parsear el balance');
  }

  // 1. Perfil del estudiante
  if (parsed.profile.studentCode !== 'A00414870') {
    throw new Error(`Código esperado A00414870, obtenido ${parsed.profile.studentCode}`);
  }
  if (!parsed.profile.name || !parsed.profile.name.includes('Palomino')) {
    throw new Error(`Nombre esperado Isabella Palomino, obtenido ${parsed.profile.name}`);
  }
  if (parsed.profile.gpa !== 4.5) {
    throw new Error(`Promedio esperado 4.5, obtenido ${parsed.profile.gpa}`);
  }
  if (parsed.profile.semesterNumber !== 4) {
    throw new Error(`Semestre esperado 4, obtenido ${parsed.profile.semesterNumber}`);
  }
  if (!parsed.profile.program || !parsed.profile.program.includes('Economía')) {
    throw new Error(`Programa esperado Economía y Negocios Internacionales, obtenido ${parsed.profile.program}`);
  }
  console.log(`✓ Perfil verificado: ${parsed.profile.name} (${parsed.profile.studentCode}) · ${parsed.profile.program}`);
  console.log(`✓ Semestre número: ${parsed.profile.semesterNumber} (4to semestre)`);
  console.log(`✓ Nombre de semestre generado: "${parsed.semester.name}"`);

  // 2. Materias activas matriculadas (DEBE SER EXACTAMENTE 7, NO 30 NI 65)
  if (parsed.subjects.length !== 7) {
    throw new Error(`Se esperaban exactamente 7 materias matriculadas, pero se obtuvieron ${parsed.subjects.length}: ${parsed.subjects.map(s => s.name).join(', ')}`);
  }

  const expectedNrcs = ['11805', '11602', '11950', '11961', '11959', '12485', '12027'];
  for (const nrc of expectedNrcs) {
    const sub = parsed.subjects.find((s) => s.nrc === nrc);
    if (!sub) {
      throw new Error(`Falta la materia con NRC ${nrc}`);
    }
  }

  console.log(`✓ 7 Asignaturas matriculadas correctamente aisladas sin mezclar historial ni malla curricular:`);
  parsed.subjects.forEach((s, idx) => {
    console.log(`   ${idx + 1}. [NRC ${s.nrc} | Código ${s.code}] ${s.name}`);
  });

  console.log('ALL ISABELLA BALANCE PARSING TESTS PASSED SUCCESSFULLY! 🎉');
}

testIsabellaBalanceParsing();
