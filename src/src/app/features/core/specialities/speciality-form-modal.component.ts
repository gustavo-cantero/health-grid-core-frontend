import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { SpecialityService } from '../../../core/services/speciality.service';
import { Speciality } from '../../../core/models/speciality.model';

@Component({
  selector: 'app-speciality-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      [title]="title()"
      [maxWidth]="420"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group">
          <label for="spec-name">Nombre</label>
          <input id="spec-name" type="text" formControlName="name" placeholder="Ej: Dermatología" />
        </div>
        <p class="api-note">{{ apiNote() }}</p>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn-main" [disabled]="loading()">
            {{ existing() ? 'Guardar cambios' : 'Crear especialidad' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class SpecialityFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly specs = inject(SpecialityService);

  readonly open = input<boolean>(false);
  readonly existing = input<Speciality | null>(null);
  readonly close = output<void>();
  readonly saved = output<Speciality>();

  protected readonly loading = signal<boolean>(false);

  protected readonly title = computed(() => this.existing() ? 'Editar especialidad' : 'Nueva especialidad');
  protected readonly apiNote = computed(() =>
    this.existing() ? '→ PUT /specialities/{id}' : '→ POST /specialities',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

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
