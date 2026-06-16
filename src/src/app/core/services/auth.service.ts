import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserPayload } from '../models/user.model';
import { ApiAuthResponse, ApiUser } from '../models/api.model';
import { toError } from '../utils/api-error';
import { isTokenExpired, permissionsFromToken } from '../utils/jwt';
import { CORE_MODULES, MODULE_READ_PERMISSIONS } from '../auth/permissions';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
}

const SESSION_KEY = 'hg_session';
const TOKEN_KEY = 'hg_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly _currentUser = signal<SessionUser | null>(this.loadSession());
  readonly currentUser = this._currentUser.asReadonly();

  private _token = this.loadToken();

  private readonly _permissions = signal<string[]>(permissionsFromToken(this._token));
  /** Permisos otorgados por el JWT actual (vacío cuando no hay sesión). */
  readonly permissions = this._permissions.asReadonly();

  readonly isAuthenticated = signal<boolean>(this._currentUser() !== null && this._token !== null);

  token(): string | null {
    return this._token;
  }

  /** True cuando la sesión actual tiene el permiso indicado. */
  has(permission: string): boolean {
    return this._permissions().includes(permission);
  }

  /** True cuando la sesión tiene al menos uno de los permisos indicados. */
  hasAny(...permissions: string[]): boolean {
    return permissions.some((p) => this.has(p));
  }

  /** True cuando la sesión tiene todos los permisos indicados. */
  hasAll(...permissions: string[]): boolean {
    return permissions.every((p) => this.has(p));
  }

  /** Ruta del primer módulo core que el usuario puede leer, o null si ninguno. */
  firstAllowedModuleRoute(): string | null {
    return CORE_MODULES.find((m) => this.has(m.read))?.path ?? null;
  }

  login(email: string, password: string): Observable<SessionUser> {
    return this.http.post<ApiAuthResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      map((res) => this.persistWithAccessCheck(res)),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  register(payload: CreateUserPayload): Observable<SessionUser> {
    const body = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      password: payload.password,
    };
    return this.http.post<ApiAuthResponse>(`${this.baseUrl}/register`, body).pipe(
      map((res) => this.persistWithAccessCheck(res)),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  requestReset(email: string): Observable<void> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email }).pipe(
      map(() => undefined),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<void> {
    return this.http
      .post(`${this.baseUrl}/reset-password`, { email, code, new_password: newPassword })
      .pipe(
        map(() => undefined),
        catchError((err) => throwError(() => toError(err))),
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    const user = this._currentUser();
    if (!user) {
      return throwError(() => new Error('No hay una sesión activa.'));
    }
    return this.http
      .put(`${environment.apiBaseUrl}/users/${user.id}/password`, {
        current_password: currentPassword,
        new_password: newPassword,
      })
      .pipe(
        map(() => undefined),
        catchError((err) => throwError(() => toError(err))),
      );
  }

  updateMyProfile(patch: { name: string; email: string }): Observable<SessionUser> {
    const user = this._currentUser();
    if (!user) {
      return throwError(() => new Error('No hay una sesión activa.'));
    }
    const { firstName, lastName } = splitName(patch.name);
    return this.http
      .put<ApiUser>(`${environment.apiBaseUrl}/users/${user.id}`, {
        first_name: firstName,
        last_name: lastName,
        email: patch.email,
      })
      .pipe(
        map((apiUser) => {
          const next = this.toSessionUser(apiUser);
          this._currentUser.set(next);
          localStorage.setItem(SESSION_KEY, JSON.stringify(next));
          return next;
        }),
        catchError((err) => throwError(() => toError(err))),
      );
  }

  logout(): void {
    // Best-effort server logout; clear local state immediately regardless.
    this.http
      .post(`${this.baseUrl}/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.clearSession();
  }

  clearSession(): void {
    this._currentUser.set(null);
    this._token = null;
    this._permissions.set([]);
    this.isAuthenticated.set(false);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Persiste la sesión solo si el JWT da acceso a al menos un módulo core; en
   * caso contrario lanza un error para que las pantallas de auth muestren el
   * motivo y el usuario nunca quede logueado sin nada que hacer.
   */
  private persistWithAccessCheck(res: ApiAuthResponse): SessionUser {
    const perms = permissionsFromToken(res.token);
    if (!perms.some((p) => MODULE_READ_PERMISSIONS.includes(p))) {
      throw new Error(
        'Tu usuario no tiene permisos para acceder a ningún módulo. Contactá a un administrador.',
      );
    }
    return this.persist(res);
  }

  private persist(res: ApiAuthResponse): SessionUser {
    const user = this.toSessionUser(res.user);
    this._token = res.token;
    this._permissions.set(permissionsFromToken(res.token));
    this._currentUser.set(user);
    this.isAuthenticated.set(true);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  private toSessionUser(apiUser: ApiUser): SessionUser {
    const name = `${apiUser.first_name} ${apiUser.last_name}`.trim();
    return {
      id: apiUser.id,
      name,
      email: apiUser.email,
      role: apiUser.roles?.[0]?.name ?? 'Usuario',
      initials: this.computeInitials(name),
    };
  }

  private loadSession(): SessionUser | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }

  private loadToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && isTokenExpired(token)) {
      // Sesión vencida: la descartamos para tratar al usuario como deslogueado.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return token;
  }

  private computeInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts[1]?.charAt(0) ?? '';
    return (first + second).toUpperCase() || 'U';
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
