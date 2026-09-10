import { NextRequest, NextResponse } from 'next/server';

const MAX_ICS_SIZE = 2 * 1024 * 1024; // 2 MB
const REQUEST_TIMEOUT_MS = 5000; // 5 segundos

// Lista de hosts e IPs bloqueados para mitigar SSRF
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
];

function isSafeUrl(urlString: string): { safe: boolean; error?: string; url?: URL } {
  try {
    const parsed = new URL(urlString);

    // 1. Solo permitir protocolo HTTPS (o webcal que se normaliza a https)
    if (parsed.protocol === 'webcal:') {
      parsed.protocol = 'https:';
    }

    if (parsed.protocol !== 'https:') {
      return { safe: false, error: 'Solo se permiten enlaces seguros con protocolo https://' };
    }

    // 2. Comprobar hostname contra listas de bloqueo de IPs privadas/locales
    const hostname = parsed.hostname.toLowerCase();
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return { safe: false, error: 'Acceso a redes internas o locales bloqueado por seguridad (Anti-SSRF).' };
      }
    }

    return { safe: true, url: parsed };
  } catch {
    return { safe: false, error: 'La URL proporcionada no es válida.' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Parámetro URL requerido.' }, { status: 400 });
    }

    const { safe, error, url: validatedUrl } = isSafeUrl(url.trim());
    if (!safe || !validatedUrl) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Fetch con timeout y límite de redirecciones
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(validatedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'MiSemestre-CalendarSync/1.0',
          Accept: 'text/calendar, application/json, text/plain, */*',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `El servidor del calendario respondió con error ${response.status}: ${response.statusText}` },
          { status: 502 }
        );
      }

      // Validar longitud del contenido (Content-Length)
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_ICS_SIZE) {
        return NextResponse.json(
          { error: 'El archivo de calendario excede el tamaño máximo permitido (2 MB).' },
          { status: 413 }
        );
      }

      const text = await response.text();

      if (text.length > MAX_ICS_SIZE) {
        return NextResponse.json(
          { error: 'El contenido descargado excede el tamaño límite de 2 MB.' },
          { status: 413 }
        );
      }

      if (!text.includes('BEGIN:VCALENDAR')) {
        return NextResponse.json(
          { error: 'La dirección URL no devolvió un calendario iCalendar válido (falta BEGIN:VCALENDAR).' },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        content: text,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Tiempo de espera agotado al intentar conectar con el calendario (timeout 5s).' },
          { status: 504 }
        );
      }
      throw err;
    }
  } catch (err) {
    console.error('Error en /api/calendar/import-url:', err);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar el enlace de calendario.' },
      { status: 500 }
    );
  }
}
