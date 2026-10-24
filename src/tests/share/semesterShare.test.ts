import {
  encodeSemesterShare,
  decodeSemesterShare,
  generateShareUrl,
  SharedSemesterPayload,
} from '../../lib/share/semesterShare';

function runShareTests() {
  console.log('--- Testing Semester Share Encoding/Decoding ---');

  const testPayload: SharedSemesterPayload = {
    u: 'Universidad Icesi',
    c: 'Ingeniería Industrial',
    s: 4,
    nrcs: ['05359', '42002', '11805', '11602'],
    author: 'Camilo Andres',
    exams: [
      { title: 'Parcial 1 Optimización', nrc: '05359', date: '2026-10-20T07:00:00', weight: 20 },
    ],
  };

  const encoded = encodeSemesterShare(testPayload);
  if (!encoded || typeof encoded !== 'string') {
    throw new Error('encodeSemesterShare no generó un string válido');
  }
  console.log('✓ Encoded string generated:', encoded);

  const decoded = decodeSemesterShare(encoded);
  if (!decoded) {
    throw new Error('decodeSemesterShare retornó null para string válido');
  }

  if (decoded.u !== testPayload.u || decoded.c !== testPayload.c || decoded.nrcs.length !== 4) {
    throw new Error(`Datos decodificados no coinciden con original: ${JSON.stringify(decoded)}`);
  }
  console.log('✓ Decoded payload matches original data');

  const url = generateShareUrl(testPayload, 'https://mi-semestre.app');
  if (!url.startsWith('https://mi-semestre.app/?share=')) {
    throw new Error(`URL generada no tiene el formato esperado: ${url}`);
  }
  console.log('✓ generateShareUrl generated:', url);

  const invalid = decodeSemesterShare('this-is-not-valid-base64-json!!!');
  if (invalid !== null) {
    throw new Error('decodeSemesterShare debería retornar null para string inválido');
  }
  console.log('✓ Graceful null handling on invalid string');

  console.log('ALL SEMESTER SHARE TESTS PASSED! 🎉\n');
}

runShareTests();
