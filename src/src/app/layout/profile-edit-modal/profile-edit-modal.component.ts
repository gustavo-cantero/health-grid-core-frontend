import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { ConfirmUnsavedComponent } from '../../shared/ui/confirm-unsaved/confirm-unsaved.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-profile-edit-modal',
  imports: [ModalComponent, ReactiveFormsModule, ConfirmUnsavedComponent],
  templateUrl: './profile-edit-modal.component.html',
  styleUrls: ['./profile-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly open = input<boolean>(false);
  readonly close = output<void>();

  protected readonly confirmingCancel = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly isDirty = computed(() => this.form.dirty);

  requestClose(): void {
    if (this.isDirty()) {
      this.confirmingCancel.set(true);
    } else {
      this.close.emit();
    }
  }

  confirmClose(): void {
    this.confirmingCancel.set(false);
    this.close.emit();
  }

  constructor() {
    effect(() => {
      if (this.open()) {
        const u = this.auth.currentUser();
        this.form.reset({ name: u?.name ?? '', email: u?.email ?? '' });
      }
    });
  }

  protected readonly loading = signal<boolean>(false);
  protected readonly serverError = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.serverError.set(null);
    this.auth.updateMyProfile(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.show('Perfil actualizado correctamente');
        this.close.emit();
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.serverError.set(err.message);
      },
    });
  }
}
