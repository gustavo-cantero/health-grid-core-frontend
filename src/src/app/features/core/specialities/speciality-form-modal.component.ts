import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ConfirmUnsavedComponent } from '../../../shared/ui/confirm-unsaved/confirm-unsaved.component';
import { SpecialityService } from '../../../core/services/speciality.service';
import { Speciality } from '../../../core/models/speciality.model';

@Component({
  selector: 'app-speciality-form-modal',
  imports: [ModalComponent, ReactiveFormsModule, ConfirmUnsavedComponent],
  templateUrl: './speciality-form-modal.component.html',
  styleUrls: ['./speciality-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialityFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly specs = inject(SpecialityService);

  readonly open = input<boolean>(false);
  readonly existing = input<Speciality | null>(null);
  readonly close = output<void>();
  readonly saved = output<Speciality>();

  protected readonly loading = signal<boolean>(false);
  protected readonly confirmingCancel = signal<boolean>(false);

  protected readonly title = computed(() => this.existing() ? 'Editar especialidad' : 'Nueva especialidad');

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
    const obs$ = existing ? this.specs.update(existing.id, payload) : this.specs.create(payload);
    obs$.subscribe(s => {
      this.loading.set(false);
      this.saved.emit(s);
    });
  }
}
