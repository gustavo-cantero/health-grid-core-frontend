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
import { LocationService } from '../../../core/services/location.service';
import { Location } from '../../../core/models/location.model';

@Component({
  selector: 'app-location-form-modal',
  imports: [ModalComponent, ReactiveFormsModule, ConfirmUnsavedComponent],
  templateUrl: './location-form-modal.component.html',
  styleUrls: ['./location-form-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly locs = inject(LocationService);

  readonly open = input<boolean>(false);
  readonly existing = input<Location | null>(null);
  readonly close = output<void>();
  readonly saved = output<Location>();

  protected readonly loading = signal<boolean>(false);
  protected readonly confirmingCancel = signal<boolean>(false);

  protected readonly title = computed(() =>
    this.existing() ? 'Editar ubicación' : 'Nueva ubicación',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
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
        this.form.reset({
          name: e?.name ?? '',
          address: e?.address ?? '',
          city: e?.city ?? '',
          country: e?.country ?? '',
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue();
    this.loading.set(true);
    const existing = this.existing();
    const obs$ = existing ? this.locs.update(existing.id, payload) : this.locs.create(payload);
    obs$.subscribe((l) => {
      this.loading.set(false);
      this.saved.emit(l);
    });
  }
}
