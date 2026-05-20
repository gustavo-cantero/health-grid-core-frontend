import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo-wrap">
          <div class="auth-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h1 class="auth-title">Health Grid</h1>
          <p class="auth-sub">Ingresá a tu cuenta de HG Core</p>
        </div>

        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autocomplete="email"
              placeholder="usuario@healthgrid.com"
              formControlName="email"
            />
          </div>
          <div class="form-group">
            <label for="login-pass">Contraseña</label>
            <input
              id="login-pass"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              formControlName="password"
            />
          </div>
          <div class="forgot-link">
            <a routerLink="/forgot-password">¿Olvidaste tu contraseña?</a>
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Ingresando…' : 'Iniciar sesión' }}
          </button>
        </form>

        <p class="auth-link">
          ¿No tenés cuenta? <a routerLink="/register">Registrate</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['admin@healthgrid.com', [Validators.required, Validators.email]],
    password: ['Admin1234', [Validators.required]],
  });

  onSubmit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.error.set('Credenciales inválidas. Revisá tu email y contraseña.');
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/core/users');
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}
