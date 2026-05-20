import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal/modal.component';
import { ConfirmUnsavedComponent } from '../../../shared/ui/confirm-unsaved/confirm-unsaved.component';
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
  imports: [ModalComponent, ReactiveFormsModule, ChipsInputComponent, ConfirmUnsavedComponent],
  templateUrl: './user-edit-modal.component.html',
  styleUrls: ['./user-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  protected readonly confirmingCancel = signal<boolean>(false);

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

  protected readonly isDirty = computed(() => {
    const u = this.user();
    if (!u) return false;
    const sameIds = (a: number[], b: number[]) => {
      if (a.length !== b.length) return false;
      const sa = [...a].sort((x, y) => x - y);
      const sb = [...b].sort((x, y) => x - y);
      return sa.every((v, i) => v === sb[i]);
    };
    return (
      this.dataForm.dirty ||
      !sameIds(this.draftRoleIds(), u.roleIds) ||
      !sameIds(this.draftSpecIds(), u.specialityIds) ||
      !sameIds(this.draftLocIds(), u.locationIds)
    );
  });

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

  onAddRole(roleId: number): void { this.draftRoleIds.update(ids => [...ids, roleId]); }
  onRemoveRole(roleId: number): void { this.draftRoleIds.update(ids => ids.filter(id => id !== roleId)); }

  onAddSpec(specId: number): void { this.draftSpecIds.update(ids => [...ids, specId]); }
  onRemoveSpec(specId: number): void { this.draftSpecIds.update(ids => ids.filter(id => id !== specId)); }

  onAddLoc(locId: number): void { this.draftLocIds.update(ids => [...ids, locId]); }
  onRemoveLoc(locId: number): void { this.draftLocIds.update(ids => ids.filter(id => id !== locId)); }
}
