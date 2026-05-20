import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

type ResetStep = 1 | 2 | 3;

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
