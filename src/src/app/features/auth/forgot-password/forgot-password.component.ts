import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

type ResetStep = 1 | 2;

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

  private email = '';

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // The API validates the code only on the final reset call, so code + new
  // password are captured together in a single step.
  protected readonly resetForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    passwordConfirm: ['', [Validators.required]],
  });

  submitEmail(): void {
    this.error.set(null);
    if (this.emailForm.invalid) {
      this.error.set('Ingresá un email válido.');
      return;
    }
    this.email = this.emailForm.getRawValue().email;
    this.loading.set(true);
    this.auth.requestReset(this.email).subscribe({
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

  submitReset(): void {
    this.error.set(null);
    const { code, password, passwordConfirm } = this.resetForm.getRawValue();
    if (this.resetForm.invalid) {
      if (this.resetForm.controls.code.invalid) {
        this.error.set('El código debe tener 6 dígitos.');
      } else {
        this.error.set('La contraseña debe tener al menos 6 caracteres.');
      }
      this.resetForm.markAllAsTouched();
      return;
    }
    if (password !== passwordConfirm) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.email, code, password).subscribe({
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
