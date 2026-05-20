import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

type ResetStep = 1 | 2 | 3;

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo-wrap">
          <div class="auth-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h1 class="auth-title">Recuperar contraseña</h1>
          <p class="auth-sub">Te enviamos un código a tu email</p>
        </div>

        <div class="reset-steps" aria-label="Pasos de recuperación">
          <span class="step-dot" [class.done]="step() >= 1" [class.current]="step() === 1" [class.pending]="step() < 1">1</span>
          <span class="step-line"></span>
          <span class="step-dot" [class.done]="step() >= 2" [class.current]="step() === 2" [class.pending]="step() < 2">2</span>
          <span class="step-line"></span>
          <span class="step-dot" [class.done]="step() === 3 && completed()" [class.current]="step() === 3" [class.pending]="step() < 3">3</span>
        </div>

        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }

        @if (step() === 1) {
          <form [formGroup]="emailForm" (ngSubmit)="submitEmail()" novalidate>
            <p style="font-size:13px;color:#666;margin-bottom:16px;line-height:1.6">
              Ingresá tu email y te enviamos un código de verificación.
            </p>
            <div class="form-group">
              <label for="fp-email">Email</label>
              <input id="fp-email" type="email" autocomplete="email" formControlName="email" placeholder="usuario@healthgrid.com" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="loading()">Enviar código</button>
          </form>
        }

        @if (step() === 2) {
          <form [formGroup]="codeForm" (ngSubmit)="submitCode()" novalidate>
            <p style="font-size:13px;color:#666;margin-bottom:16px;line-height:1.6">
              Ingresá el código de 6 dígitos que enviamos a tu email.
            </p>
            <div class="form-group">
              <label for="fp-code">Código de verificación</label>
              <input
                id="fp-code" type="text" inputmode="numeric" autocomplete="one-time-code"
                maxlength="6" placeholder="123456"
                style="letter-spacing:.2em;font-size:20px;text-align:center"
                formControlName="code"
              />
            </div>
            <button type="submit" class="btn-primary" [disabled]="loading()">Verificar código</button>
          </form>
        }

        @if (step() === 3) {
          <form [formGroup]="newPasswordForm" (ngSubmit)="submitNewPassword()" novalidate>
            <p style="font-size:13px;color:#666;margin-bottom:16px;line-height:1.6">Ingresá tu nueva contraseña.</p>
            <div class="form-group">
              <label for="fp-newpass">Nueva contraseña</label>
              <input id="fp-newpass" type="password" autocomplete="new-password" formControlName="password" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label for="fp-newpass2">Confirmar contraseña</label>
              <input id="fp-newpass2" type="password" autocomplete="new-password" formControlName="passwordConfirm" placeholder="••••••••" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="loading()">Cambiar contraseña</button>
          </form>
        }

        <p class="auth-link" style="margin-top:20px"><a routerLink="/login">← Volver al login</a></p>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly step = signal<ResetStep>(1);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly completed = signal<boolean>(false);
  protected readonly currentStep = computed(() => this.step());

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly codeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  protected readonly newPasswordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    passwordConfirm: ['', [Validators.required]],
  });

  submitEmail(): void {
    this.error.set(null);
    if (this.emailForm.invalid) {
      this.error.set('Ingresá un email válido.');
      return;
    }
    this.loading.set(true);
    this.auth.requestReset(this.emailForm.getRawValue().email).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(2);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }

  submitCode(): void {
    this.error.set(null);
    if (this.codeForm.invalid) {
      this.error.set('El código debe tener 6 dígitos.');
      return;
    }
    this.loading.set(true);
    this.auth.verifyResetCode(this.codeForm.getRawValue().code).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(3);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }

  submitNewPassword(): void {
    this.error.set(null);
    const { password, passwordConfirm } = this.newPasswordForm.getRawValue();
    if (this.newPasswordForm.invalid) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(password).subscribe({
      next: () => {
        this.loading.set(false);
        this.completed.set(true);
        this.toast.show('Contraseña actualizada correctamente');
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message);
      },
    });
  }
}
