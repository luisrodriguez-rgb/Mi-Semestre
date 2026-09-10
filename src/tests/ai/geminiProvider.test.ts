import { GeminiProvider } from '../../lib/ai/geminiProvider';

async function testGeminiProvider() {
  console.log('--- Testing GeminiProvider (Fallback to Deterministic Preprocessor) ---');

  const provider = new GeminiProvider('dummy-key-to-test-graceful-fallback');

  const enrolledSubjects = [
    { id: 'sub-est', name: 'Estadística Aplicada II', code: '11373' },
  ];

  const raw = 'Parcial de estadística el 25 de septiembre a las 10:00 am, peso 25%';
  const res = await provider.extractInboxItems({
    rawText: raw,
    enrolledSubjects,
    baseDate: new Date(2026, 8, 10),
  });

  console.log(`Source Engine used: ${res.sourceEngine}`);
  console.log(`Extracted items count: ${res.items.length}`);

  if (res.items.length === 0) {
    throw new Error('Expected at least 1 item extracted via graceful fallback');
  }

  const item = res.items[0];
  console.log('Sample item:', {
    title: item.title,
    date: item.date,
    startTime: item.startTime,
    weight: item.weight,
    confidence: item.confidence,
    sourceText: item.sourceText,
  });

  if (item.type !== 'exam') {
    throw new Error(`Expected exam, got ${item.type}`);
  }

  console.log('✓ GeminiProvider graceful fallback to deterministic preprocessor passed successfully');
  console.log('ALL GEMINI PROVIDER TESTS PASSED SUCCESSFULLY!\n');
}

testGeminiProvider();
