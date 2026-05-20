import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ConfirmUnsavedComponent } from '../../../shared/ui/confirm-unsaved/confirm-unsaved.component';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-create-modal',
  imports: [ModalComponent, ReactiveFormsModule, ConfirmUnsavedComponent],
  templateUrl: './user-create-modal.component.html',
  styleUrls: ['./user-create-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreateModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UserService);

  readonly open = input<boolean>(false);
  readonly close = output<void>();
  readonly created = output<User>();

  protected readonly loading = signal<boolean>(false);
  protected readonly confirmingCancel = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.users.create(this.form.getRawValue()).subscribe(user => {
      this.loading.set(false);
      this.form.reset({ firstName: '', lastName: '', email: '', password: '' });
      this.created.emit(user);
    });
  }
}
