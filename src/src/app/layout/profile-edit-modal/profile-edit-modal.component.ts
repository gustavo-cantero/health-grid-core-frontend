import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-profile-edit-modal',
  imports: [ModalComponent, ReactiveFormsModule],
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

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        const u = this.auth.currentUser();
        this.form.reset({ name: u?.name ?? '', email: u?.email ?? '' });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.auth.updateMyProfile(this.form.getRawValue());
    this.toast.show('Perfil actualizado correctamente');
    this.close.emit();
  }
}
