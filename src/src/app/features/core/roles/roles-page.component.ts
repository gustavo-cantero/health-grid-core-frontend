import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Role } from '../../../core/models/role.model';
import { RoleCreateModalComponent } from './role-create-modal.component';
import { RoleEditModalComponent } from './role-edit-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';

type RolesTab = 'list' | 'matrix';

@Component({
  selector: 'app-roles-page',
  imports: [RoleCreateModalComponent, RoleEditModalComponent, ConfirmDeleteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-eyebrow">Gestión</div>
    <h1 class="page-title">Roles</h1>
    <p class="page-subtitle">Definí los roles del sistema y asignales permisos.</p>

    <div style="text-align:right;margin-bottom:16px">
      <button type="button" class="btn-main" (click)="openCreate.set(true)">+ Nuevo rol</button>
    </div>

    <div class="tabs" role="tablist" aria-label="Vistas de roles">
      <button type="button" class="tab" role="tab" [attr.aria-selected]="tab() === 'list'" [class.active]="tab() === 'list'" (click)="tab.set('list')">Lista de roles</button>
      <button type="button" class="tab" role="tab" [attr.aria-selected]="tab() === 'matrix'" [class.active]="tab() === 'matrix'" (click)="tab.set('matrix')">Matriz de permisos</button>
    </div>

    @switch (tab()) {
      @case ('list') {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Rol</th>
                <th scope="col">Permisos</th>
                <th scope="col">Usuarios</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of roles(); track r.id) {
                <tr>
                  <td><span class="badge" [class]="'badge badge-' + r.color">{{ r.name }}</span></td>
                  <td>
                    @for (p of firstPerms(r, 3); track p.id) {
                      <span class="badge badge-gray">{{ p.name }}</span>
                    }
                    @if (r.permissionIds.length > 3) {
                      <span class="badge badge-gray">+{{ r.permissionIds.length - 3 }} más</span>
                    }
                    @if (r.permissionIds.length === 0) {
                      <span class="cell-muted">—</span>
                    }
                  </td>
                  <td>{{ userCount(r.id) }}</td>
                  <td>
                    <div class="actions">
                      <button type="button" class="btn-outline" (click)="editing.set(r)">Editar</button>
                      <button type="button" class="btn-danger" (click)="deleting.set(r)">Eliminar</button>
                    </div>
                  </td>
                </tr>
              }
              @if (roles().length === 0) {
                <tr><td colspan="4" class="empty-state">No hay roles definidos.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
      @case ('matrix') {
        <div class="perm-matrix" [style.--perm-cols]="roles().length">
          <div class="perm-row header">
            <div class="perm-cell">Permiso</div>
            @for (r of roles(); track r.id) {
              <div class="perm-cell">{{ r.name }}</div>
            }
          </div>
          @for (p of permissions(); track p.id) {
            <div class="perm-row">
              <div class="perm-cell"><code>{{ p.name }}</code></div>
              @for (r of roles(); track r.id) {
                <div class="perm-cell">
                  <button
                    type="button"
                    class="check"
                    [class.on]="isChecked(r.id, p.id)"
                    [attr.aria-label]="(isChecked(r.id, p.id) ? 'Quitar ' : 'Asignar ') + p.name + ' a ' + r.name"
                    [attr.aria-pressed]="isChecked(r.id, p.id)"
                    (click)="toggleCheck(r.id, p.id)"
                  >{{ isChecked(r.id, p.id) ? '✓' : '' }}</button>
                </div>
              }
            </div>
          }
        </div>
        <div style="margin-top:16px;text-align:right">
          <button type="button" class="btn-main" (click)="saveMatrix()">Guardar cambios</button>
        </div>
      }
    }

    <app-role-create-modal
      [open]="openCreate()"
      (close)="openCreate.set(false)"
      (created)="onCreated($event)"
    />

    <app-role-edit-modal
      [open]="editing() !== null"
      [role]="editing()"
      (close)="editing.set(null)"
      (updated)="onUpdated($event)"
    />

    <app-confirm-delete
      [open]="deleting() !== null"
      entityLabel="rol"
      (cancel)="deleting.set(null)"
      (confirm)="confirmDelete()"
    />
  `,
})
export class RolesPageComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly permService = inject(PermissionService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  protected readonly roles = this.roleService.roles;
  protected readonly permissions = this.permService.permissions;

  protected readonly tab = signal<RolesTab>('list');
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<Role | null>(null);
  protected readonly deleting = signal<Role | null>(null);

  private readonly matrixDraft = signal<Record<number, Set<number>>>({});

  protected readonly userCountMap = computed(() => {
    const map = new Map<number, number>();
    for (const u of this.userService.users()) {
      for (const rid of u.roleIds) {
        map.set(rid, (map.get(rid) ?? 0) + 1);
      }
    }
    return map;
  });

  ngOnInit(): void {
    this.roleService.list().subscribe();
    this.permService.list().subscribe();
    this.userService.list().subscribe();
    this.refreshDraft();
  }

  userCount(roleId: number): number {
    return this.userCountMap().get(roleId) ?? 0;
  }

  firstPerms(role: Role, n: number) {
    const ids = role.permissionIds.slice(0, n);
    return this.permService.permissions().filter(p => ids.includes(p.id));
  }

  isChecked(roleId: number, permId: number): boolean {
    return this.matrixDraft()[roleId]?.has(permId) ?? false;
  }

  toggleCheck(roleId: number, permId: number): void {
    this.matrixDraft.update(curr => {
      const next = { ...curr };
      const set = new Set(next[roleId] ?? []);
      if (set.has(permId)) set.delete(permId); else set.add(permId);
      next[roleId] = set;
      return next;
    });
  }

  saveMatrix(): void {
    const matrix: Record<number, number[]> = {};
    for (const [roleId, set] of Object.entries(this.matrixDraft())) {
      matrix[Number(roleId)] = Array.from(set);
    }
    this.roleService.saveMatrix(matrix).subscribe(() => {
      this.toast.show('Matriz guardada correctamente');
    });
  }

  onCreated(role: Role): void {
    this.openCreate.set(false);
    this.toast.show(`Rol "${role.name}" creado correctamente`);
    this.refreshDraft();
  }

  onUpdated(_role: Role): void {
    this.editing.set(null);
    this.refreshDraft();
  }

  confirmDelete(): void {
    const r = this.deleting();
    if (!r) return;
    this.roleService.remove(r.id).subscribe(() => {
      this.deleting.set(null);
      this.toast.show('Rol eliminado (soft delete aplicado)');
      this.refreshDraft();
    });
  }

  private refreshDraft(): void {
    const draft: Record<number, Set<number>> = {};
    for (const role of this.roleService.roles()) {
      draft[role.id] = new Set(role.permissionIds);
    }
    this.matrixDraft.set(draft);
  }
}
