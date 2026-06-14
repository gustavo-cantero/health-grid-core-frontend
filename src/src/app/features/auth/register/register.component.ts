import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        // Register already returns a token (auto-login) → go straight to the app.
        this.router.navigateByUrl('/core/users');
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
