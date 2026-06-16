// Helpers mínimos de JWT del lado del cliente. Acá el token solo se *decodifica*
// (nunca se valida la firma — el servidor es la fuente de verdad); leemos el claim
// `permissions` para manejar la autorización en la UI y `exp` para descartar
// sesiones vencidas.

export interface JwtPayload {
  permissions?: string[];
  exp?: number;
  iat?: number;
  user_id?: number;
}

/** Decodifica el payload de un JWT. Devuelve null si el token está malformado. */
export function decodeJwt(token: string | null): JwtPayload | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** El claim `permissions`, o un array vacío si no está presente o es inválido. */
export function permissionsFromToken(token: string | null): string[] {
  const payload = decodeJwt(token);
  return Array.isArray(payload?.permissions) ? payload!.permissions : [];
}

/** True cuando el token trae un claim `exp` que ya está en el pasado. */
export function isTokenExpired(token: string | null): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
