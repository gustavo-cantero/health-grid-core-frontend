import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { LocationService } from '../../../core/services/location.service';
import { Location } from '../../../core/models/location.model';

@Component({
  selector: 'app-location-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      [title]="title()"
      [maxWidth]="460"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group">
          <label for="loc-name">Nombre</label>
          <input id="loc-name" type="text" formControlName="name" placeholder="Ej: Sede Sur" />
        </div>
        <div class="form-group">
          <label for="loc-addr">Dirección</label>
          <input id="loc-addr" type="text" formControlName="address" placeholder="Av. Rivadavia 1234" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="loc-city">Ciudad</label>
            <input id="loc-city" type="text" formControlName="city" placeholder="Buenos Aires" />
          </div>
          <div class="form-group">
            <label for="loc-country">País</label>
            <input id="loc-country" type="text" formControlName="country" placeholder="Argentina" />
          </div>
        </div>
        <p class="api-note">{{ apiNote() }}</p>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
          <button type="submit" class="btn-main" [disabled]="loading()">
            {{ existing() ? 'Guardar cambios' : 'Crear ubicación' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class LocationFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly locs = inject(LocationService);

  readonly open = input<boolean>(false);
  readonly existing = input<Location | null>(null);
  readonly close = output<void>();
  readonly saved = output<Location>();

  protected readonly loading = signal<boolean>(false);

  protected readonly title = computed(() => this.existing() ? 'Editar ubicación' : 'Nueva ubicación');
  protected readonly apiNote = computed(() =>
    this.existing() ? '→ PUT /locations/{id}' : '→ POST /locations',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
  });

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
    obs$.subscribe(l => {
      this.loading.set(false);
      this.saved.emit(l);
    });
  }
}
