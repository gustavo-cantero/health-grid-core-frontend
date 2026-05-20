import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo-wrap">
          <div class="auth-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h1 class="auth-title">Crear cuenta</h1>
          <p class="auth-sub">Completá tus datos para registrarte</p>
        </div>

        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success" role="status">¡Cuenta creada exitosamente! Redirigiendo…</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="reg-first">Nombre</label>
              <input id="reg-first" type="text" autocomplete="given-name" formControlName="firstName" placeholder="Gustavo" />
            </div>
            <div class="form-group">
              <label for="reg-last">Apellido</label>
              <input id="reg-last" type="text" autocomplete="family-name" formControlName="lastName" placeholder="Arevalo" />
            </div>
          </div>
          <div class="form-group">
            <label for="reg-email">Email</label>
            <input id="reg-email" type="email" autocomplete="email" formControlName="email" placeholder="usuario@healthgrid.com" />
          </div>
          <div class="form-group">
            <label for="reg-pass">Contraseña <span style="color:#999;font-weight:400;text-transform:none;font-size:11px">(mín. 6 caracteres)</span></label>
            <input id="reg-pass" type="password" autocomplete="new-password" formControlName="password" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label for="reg-pass2">Confirmar contraseña</label>
            <input id="reg-pass2" type="password" autocomplete="new-password" formControlName="passwordConfirm" placeholder="••••••••" />
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Creando…' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="auth-link">¿Ya tenés cuenta? <a routerLink="/login">Iniciá sesión</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<boolean>(false);
  protected readonly loading = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required]],
    },
    { validators: [matchPasswords] },
  );

  onSubmit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      if (this.form.hasError('passwordMismatch')) {
        this.error.set('Las contraseñas no coinciden.');
      } else if (this.form.controls.password.hasError('minlength')) {
        this.error.set('La contraseña debe tener al menos 6 caracteres.');
      } else {
        this.error.set('Revisá los campos del formulario.');
      }
      this.form.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.register({ firstName, lastName, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigateByUrl('/login'), 1500);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const p1 = control.get('password')?.value;
  const p2 = control.get('passwordConfirm')?.value;
  if (!p1 || !p2) return null;
  return p1 === p2 ? null : { passwordMismatch: true };
}
