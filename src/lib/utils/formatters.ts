/**
 * Utilidades de formateo para interfaces de usuario amigables para estudiantes.
 */

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_FULL_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Formatea fechas al formato natural en español para estudiantes.
 * Ejemplo: "2026-10-31T14:00:00" -> "Sáb 31 oct, 2:00 p.m."
 * Ejemplo: "2026-10-31" -> "Sáb 31 oct"
 */
export function formatHumanDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const dayName = DAYS_ES[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTHS_ES[d.getMonth()];

  const hasExplicitTime =
    typeof dateInput === 'string' ? dateInput.includes('T') || dateInput.includes(':') : true;

  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');

  if (hasExplicitTime && (hours !== 0 || minutes !== '00')) {
    const period = hours >= 12 ? 'p.m.' : 'a.m.';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${dayName} ${dayNum} ${monthName}, ${hour12}:${minutes} ${period}`;
  }

  return `${dayName} ${dayNum} ${monthName}`;
}

/**
 * Traducción de códigos de motivo de decisión académica a frases en español.
 */
export const REASON_CODE_LABELS: Record<string, string> = {
  EXAM_SOON: 'Parcial cercano',
  HIGH_WEIGHT: 'Alto porcentaje',
  APPROACHING_DEADLINE: 'Entrega próxima',
  STUDY_DEFICIT: 'Requiere dedicación',
  HIGH_RISK: 'Materia prioritaria',
};

export function translateReasonCode(code: string): string {
  return REASON_CODE_LABELS[code] || code;
}
