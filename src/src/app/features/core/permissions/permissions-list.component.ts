import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { PermissionService } from '../../../core/services/permission.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Permission } from '../../../core/models/permission.model';
import { PermissionFormModalComponent } from './permission-form-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-permissions-list',
  imports: [PermissionFormModalComponent, ConfirmDeleteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-eyebrow">Gestión</div>
    <h1 class="page-title">Permisos</h1>
    <p class="page-subtitle">Creá y administrá los permisos que se asignan a los roles.</p>

    <div style="text-align:right;margin-bottom:16px">
      <button type="button" class="btn-main" (click)="openCreate.set(true)">+ Nuevo permiso</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nombre</th>
            <th scope="col">Usado en roles</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (p of permissions(); track p.id) {
            <tr>
              <td class="cell-id">#{{ p.id }}</td>
              <td><code>{{ p.name }}</code></td>
              <td>{{ rolesFor(p.id) }}</td>
              <td>
                <div class="actions">
                  <button type="button" class="btn-outline" (click)="editing.set(p)">Editar</button>
                  <button type="button" class="btn-danger" (click)="deleting.set(p)">Eliminar</button>
                </div>
              </td>
            </tr>
          }
          @if (permissions().length === 0) {
            <tr><td colspan="4" class="empty-state">No hay permisos definidos.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <app-permission-form-modal
      [open]="openCreate()"
      [existing]="null"
      (close)="openCreate.set(false)"
      (saved)="onCreated($event)"
    />

    <app-permission-form-modal
      [open]="editing() !== null"
      [existing]="editing()"
      (close)="editing.set(null)"
      (saved)="onUpdated($event)"
    />

    <app-confirm-delete
      [open]="deleting() !== null"
      entityLabel="permiso"
      (cancel)="deleting.set(null)"
      (confirm)="confirmDelete()"
    />
  `,
})
export class PermissionsListComponent implements OnInit {
  private readonly permService = inject(PermissionService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  protected readonly permissions = this.permService.permissions;
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<Permission | null>(null);
  protected readonly deleting = signal<Permission | null>(null);

  private readonly rolesByPerm = computed(() => {
    const map = new Map<number, string[]>();
    for (const r of this.roleService.roles()) {
      for (const pid of r.permissionIds) {
        const list = map.get(pid) ?? [];
        list.push(r.name);
        map.set(pid, list);
      }
    }
    return map;
  });

  ngOnInit(): void {
    this.permService.list().subscribe();
    this.roleService.list().subscribe();
  }

  rolesFor(permId: number): string {
    const list = this.rolesByPerm().get(permId);
    return list && list.length > 0 ? list.join(', ') : '—';
  }

  onCreated(p: Permission): void {
    this.openCreate.set(false);
    this.toast.show(`Permiso "${p.name}" creado correctamente`);
  }

  onUpdated(p: Permission): void {
    this.editing.set(null);
    this.toast.show(`Permiso "${p.name}" actualizado correctamente`);
  }

  confirmDelete(): void {
    const p = this.deleting();
    if (!p) return;
    this.permService.remove(p.id).subscribe(() => {
      this.deleting.set(null);
      this.toast.show('Permiso eliminado (soft delete aplicado)');
    });
  }
}
