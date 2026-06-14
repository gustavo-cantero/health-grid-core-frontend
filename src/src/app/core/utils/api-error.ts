import { HttpErrorResponse } from '@angular/common/http';

/**
 * Normalizes an HttpErrorResponse into an Error whose `message` is the API's
 * `{ error: string }` body when present, so components that display
 * `err.message` show a meaningful message.
 */
export function toError(err: unknown): Error {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { error?: string } | string | null;
    if (body && typeof body === 'object' && typeof body.error === 'string') {
      return new Error(body.error);
    }
    if (typeof body === 'string' && body.trim()) {
      return new Error(body);
    }
    if (err.status === 0) {
      return new Error('No se pudo conectar con el servidor.');
    }
    return new Error(err.message || 'Ocurrió un error inesperado.');
  }
  return err instanceof Error ? err : new Error('Ocurrió un error inesperado.');
}
