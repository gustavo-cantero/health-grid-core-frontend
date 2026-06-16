import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ConfirmUnsavedComponent } from '../../../shared/ui/confirm-unsaved/confirm-unsaved.component';
import { PermissionService } from '../../../core/services/permission.service';
import { Permission } from '../../../core/models/permission.model';

@Component({
  selector: 'app-permission-form-modal',
  imports: [ModalComponent, ReactiveFormsModule, ConfirmUnsavedComponent],
  templateUrl: './permission-form-modal.component.html',
  styleUrls: ['./permission-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly perms = inject(PermissionService);

  readonly open = input<boolean>(false);
  readonly existing = input<Permission | null>(null);
  readonly close = output<void>();
  readonly saved = output<Permission>();

  protected readonly loading = signal<boolean>(false);
  protected readonly confirmingCancel = signal<boolean>(false);

  protected readonly title = computed(() => (this.existing() ? 'Editar permiso' : 'Nuevo permiso'));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
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
        const e = this.existing();
        this.form.reset({ name: e?.name ?? '' });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = { name: this.form.getRawValue().name };
    this.loading.set(true);
    const existing = this.existing();
    const obs$ = existing ? this.perms.update(existing.id, payload) : this.perms.create(payload);
    obs$.subscribe((p) => {
      this.loading.set(false);
      this.saved.emit(p);
    });
  }
}
