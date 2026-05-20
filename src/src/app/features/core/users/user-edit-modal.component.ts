import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ChipsInputComponent, ChipOption } from '../../../shared/ui/chips-input/chips-input.component';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { SpecialityService } from '../../../core/services/speciality.service';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../core/models/user.model';

type EditTab = 'datos' | 'roles' | 'specs' | 'locs';

@Component({
  selector: 'app-user-edit-modal',
  imports: [ModalComponent, ReactiveFormsModule, ChipsInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      [title]="title()"
      [maxWidth]="560"
      (close)="close.emit()"
    >
      @if (user(); as u) {
        <div class="tabs" style="margin-bottom:16px" role="tablist" aria-label="Pestañas de edición">
          <button type="button" class="tab" role="tab" [attr.aria-selected]="tab() === 'datos'" [class.active]="tab() === 'datos'" (click)="tab.set('datos')">Datos</button>
          <button type="button" class="tab" role="tab" [attr.aria-selected]="tab() === 'roles'" [class.active]="tab() === 'roles'" (click)="tab.set('roles')">Roles</button>
          <button type="button" class="tab" role="tab" [attr.aria-selected]="tab() === 'specs'" [class.active]="tab() === 'specs'" (click)="tab.set('specs')">Especialidades</button>
          <button type="button" class="tab" role="tab" [attr.aria-selected]="tab() === 'locs'" [class.active]="tab() === 'locs'" (click)="tab.set('locs')">Ubicaciones</button>
        </div>

        @switch (tab()) {
          @case ('datos') {
            <form [formGroup]="dataForm" (ngSubmit)="saveData()" novalidate>
              <div class="form-row">
                <div class="form-group">
                  <label for="ue-first">Nombre</label>
                  <input id="ue-first" type="text" formControlName="firstName"
                    [attr.aria-describedby]="dataForm.get('firstName')?.invalid && dataForm.get('firstName')?.touched ? 'ue-first-error' : null"
                    [attr.aria-invalid]="dataForm.get('firstName')?.invalid && dataForm.get('firstName')?.touched ? 'true' : null" />
                  @if (dataForm.get('firstName')?.invalid && dataForm.get('firstName')?.touched) {
                    <span id="ue-first-error" class="form-error" role="alert">Este campo es obligatorio</span>
                  }
                </div>
                <div class="form-group">
                  <label for="ue-last">Apellido</label>
                  <input id="ue-last" type="text" formControlName="lastName"
                    [attr.aria-describedby]="dataForm.get('lastName')?.invalid && dataForm.get('lastName')?.touched ? 'ue-last-error' : null"
                    [attr.aria-invalid]="dataForm.get('lastName')?.invalid && dataForm.get('lastName')?.touched ? 'true' : null" />
                  @if (dataForm.get('lastName')?.invalid && dataForm.get('lastName')?.touched) {
                    <span id="ue-last-error" class="form-error" role="alert">Este campo es obligatorio</span>
                  }
                </div>
              </div>
              <div class="form-group">
                <label for="ue-email">Email</label>
                <input id="ue-email" type="email" formControlName="email"
                  [attr.aria-describedby]="dataForm.get('email')?.invalid && dataForm.get('email')?.touched ? 'ue-email-error' : null"
                  [attr.aria-invalid]="dataForm.get('email')?.invalid && dataForm.get('email')?.touched ? 'true' : null" />
                @if (dataForm.get('email')?.invalid && dataForm.get('email')?.touched) {
                  <span id="ue-email-error" class="form-error" role="alert">
                    @if (dataForm.get('email')?.hasError('required')) { Este campo es obligatorio }
                    @else { Ingresá un email válido }
                  </span>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
                <button type="submit" class="btn-main" [disabled]="loading()">Guardar cambios</button>
              </div>
            </form>
          }
          @case ('roles') {
            <app-chips-input
              assignedLabel="Roles asignados"
              addLabel="Agregar rol"
              placeholder="Seleccioná un rol..."
              [assigned]="assignedRoles()"
              [available]="availableRoles()"
              (add)="onAddRole($event)"
              (remove)="onRemoveRole($event)"
            />
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
              <button type="button" class="btn-main" [disabled]="loading()" (click)="saveRoles()">Guardar cambios</button>
            </div>
          }
          @case ('specs') {
            <app-chips-input
              assignedLabel="Especialidades asignadas"
              addLabel="Agregar especialidad"
              placeholder="Seleccioná una especialidad..."
              [assigned]="assignedSpecs()"
              [available]="availableSpecs()"
              (add)="onAddSpec($event)"
              (remove)="onRemoveSpec($event)"
            />
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
              <button type="button" class="btn-main" [disabled]="loading()" (click)="saveSpecs()">Guardar cambios</button>
            </div>
          }
          @case ('locs') {
            <app-chips-input
              assignedLabel="Ubicaciones asignadas"
              addLabel="Agregar ubicación"
              placeholder="Seleccioná una ubicación..."
              [assigned]="assignedLocs()"
              [available]="availableLocs()"
              (add)="onAddLoc($event)"
              (remove)="onRemoveLoc($event)"
            />
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="close.emit()">Cancelar</button>
              <button type="button" class="btn-main" [disabled]="loading()" (click)="saveLocs()">Guardar cambios</button>
            </div>
          }
        }
      }
    </app-modal>
  `,
})
export class UserEditModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly users = inject(UserService);
  private readonly roles = inject(RoleService);
  private readonly specs = inject(SpecialityService);
  private readonly locs = inject(LocationService);
  private readonly toast = inject(ToastService);

  readonly open = input<boolean>(false);
  readonly user = input<User | null>(null);
  readonly close = output<void>();
  readonly updated = output<User>();

  protected readonly tab = signal<EditTab>('datos');
  protected readonly loading = signal<boolean>(false);

  protected readonly title = computed(() => {
    const u = this.user();
    return u ? `Editar usuario — ${u.firstName} ${u.lastName}` : 'Editar usuario';
  });

  protected readonly dataForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly draftRoleIds = signal<number[]>([]);
  protected readonly draftSpecIds = signal<number[]>([]);
  protected readonly draftLocIds = signal<number[]>([]);

  protected readonly assignedRoles = computed<ChipOption[]>(() =>
    this.roles.roles()
      .filter(r => this.draftRoleIds().includes(r.id))
      .map(r => ({ id: r.id, label: r.name })),
  );
  protected readonly availableRoles = computed<ChipOption[]>(() =>
    this.roles.roles()
      .filter(r => !this.draftRoleIds().includes(r.id))
      .map(r => ({ id: r.id, label: r.name })),
  );

  protected readonly assignedSpecs = computed<ChipOption[]>(() =>
    this.specs.specialities()
      .filter(s => this.draftSpecIds().includes(s.id))
      .map(s => ({ id: s.id, label: s.name })),
  );
  protected readonly availableSpecs = computed<ChipOption[]>(() =>
    this.specs.specialities()
      .filter(s => !this.draftSpecIds().includes(s.id))
      .map(s => ({ id: s.id, label: s.name })),
  );

  protected readonly assignedLocs = computed<ChipOption[]>(() =>
    this.locs.locations()
      .filter(l => this.draftLocIds().includes(l.id))
      .map(l => ({ id: l.id, label: l.name })),
  );
  protected readonly availableLocs = computed<ChipOption[]>(() =>
    this.locs.locations()
      .filter(l => !this.draftLocIds().includes(l.id))
      .map(l => ({ id: l.id, label: l.name })),
  );

  constructor() {
    effect(() => {
      const u = this.user();
      if (u && this.open()) {
        this.dataForm.reset({ firstName: u.firstName, lastName: u.lastName, email: u.email });
        this.tab.set('datos');
        this.draftRoleIds.set([...u.roleIds]);
        this.draftSpecIds.set([...u.specialityIds]);
        this.draftLocIds.set([...u.locationIds]);
      }
    });
  }

  saveData(): void {
    const u = this.user();
    if (!u || this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.users.update(u.id, this.dataForm.getRawValue()).subscribe(saved => {
      this.loading.set(false);
      this.toast.show(`Datos de "${saved.firstName} ${saved.lastName}" actualizados`);
      this.updated.emit(saved);
    });
  }

  saveRoles(): void {
    const u = this.user();
    if (!u) return;
    this.loading.set(true);
    this.users.update(u.id, { roleIds: this.draftRoleIds() }).subscribe(saved => {
      this.loading.set(false);
      this.toast.show('Roles actualizados correctamente');
      this.updated.emit(saved);
    });
  }

  saveSpecs(): void {
    const u = this.user();
    if (!u) return;
    this.loading.set(true);
    this.users.update(u.id, { specialityIds: this.draftSpecIds() }).subscribe(saved => {
      this.loading.set(false);
      this.toast.show('Especialidades actualizadas correctamente');
      this.updated.emit(saved);
    });
  }

  saveLocs(): void {
    const u = this.user();
    if (!u) return;
    this.loading.set(true);
    this.users.update(u.id, { locationIds: this.draftLocIds() }).subscribe(saved => {
      this.loading.set(false);
      this.toast.show('Ubicaciones actualizadas correctamente');
      this.updated.emit(saved);
    });
  }

  onAddRole(roleId: number): void { this.draftRoleIds.update(ids => [...ids, roleId]); }
  onRemoveRole(roleId: number): void { this.draftRoleIds.update(ids => ids.filter(id => id !== roleId)); }

  onAddSpec(specId: number): void { this.draftSpecIds.update(ids => [...ids, specId]); }
  onRemoveSpec(specId: number): void { this.draftSpecIds.update(ids => ids.filter(id => id !== specId)); }

  onAddLoc(locId: number): void { this.draftLocIds.update(ids => [...ids, locId]); }
  onRemoveLoc(locId: number): void { this.draftLocIds.update(ids => ids.filter(id => id !== locId)); }
}
