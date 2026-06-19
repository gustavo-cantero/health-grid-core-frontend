import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-verify-account',
  imports: [ReactiveFormsModule],
  templateUrl: './verify-account.component.html',
  styleUrls: ['./verify-account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyAccountComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly submitting = signal<boolean>(false);
  protected readonly showPassword = signal<boolean>(false);
  protected readonly showConfirmPassword = signal<boolean>(false);
  protected readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  protected readonly hasToken = computed(() => this.token.trim().length > 0);

  protected readonly form = this.fb.nonNullable.group({
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required],
  });

  protected submit(): void {
    if (
      !this.hasToken() ||
      this.form.invalid ||
      this.form.controls.password.value !== this.form.controls.confirmPassword.value
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    window.setTimeout(() => {
      this.submitting.set(false);
      this.router.navigateByUrl('/login');
    }, 450);
  }
}
