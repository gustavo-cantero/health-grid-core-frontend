import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserPayload } from '../models/user.model';

export interface SessionUser {
  name: string;
  email: string;
  role: string;
  initials: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  private readonly _currentUser = signal<SessionUser | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = signal<boolean>(false);

  login(email: string, password: string): Observable<SessionUser> {
    if (!email || !password) {
      return throwError(() => new Error('Email y contraseña son requeridos.')).pipe(delay(250));
    }
    const user: SessionUser = {
      name: this.guessNameFromEmail(email),
      email,
      role: email.startsWith('admin') ? 'Administrador' : 'Usuario',
      initials: this.computeInitials(this.guessNameFromEmail(email)),
    };
    this._currentUser.set(user);
    this.isAuthenticated.set(true);
    return of(user).pipe(delay(300));
  }

  register(payload: CreateUserPayload): Observable<void> {
    if (payload.password.length < 6) {
      return throwError(() => new Error('La contraseña debe tener al menos 6 caracteres.')).pipe(delay(250));
    }
    return of(undefined).pipe(delay(400));
  }

  requestReset(_email: string): Observable<void> {
    return of(undefined).pipe(delay(300));
  }

  verifyResetCode(code: string): Observable<void> {
    if (code.length !== 6) {
      return throwError(() => new Error('Código inválido.')).pipe(delay(200));
    }
    return of(undefined).pipe(delay(300));
  }

  resetPassword(_newPassword: string): Observable<void> {
    return of(undefined).pipe(delay(300));
  }

  updateMyProfile(patch: Partial<Pick<SessionUser, 'name' | 'email'>>): void {
    const current = this._currentUser();
    if (!current) return;
    const next: SessionUser = {
      ...current,
      ...patch,
      initials: this.computeInitials(patch.name ?? current.name),
    };
    this._currentUser.set(next);
  }

  logout(): void {
    this._currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private guessNameFromEmail(email: string): string {
    const local = email.split('@')[0] ?? '';
    if (!local) return 'Usuario';
    const parts = local.split(/[._-]/).filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Usuario';
  }

  private computeInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts[1]?.charAt(0) ?? '';
    return (first + second).toUpperCase() || 'U';
  }
}
