import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

const PAGE_SIZE = 10;
import { PermissionService } from '../../../core/services/permission.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Permission } from '../../../core/models/permission.model';
import { PermissionFormModalComponent } from './permission-form-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-permissions-list',
  imports: [PermissionFormModalComponent, ConfirmDeleteComponent],
  templateUrl: './permissions-list.component.html',
  styleUrls: ['./permissions-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsListComponent implements OnInit {
  private readonly permService = inject(PermissionService);
  private readonly roleService = inject(RoleService);
  private readonly toast = inject(ToastService);

  protected readonly permissions = this.permService.permissions;
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<Permission | null>(null);
  protected readonly deleting = signal<Permission | null>(null);
  protected readonly page = signal<number>(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.permissions().length / PAGE_SIZE)),
  );

  protected readonly paged = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.permissions().slice(start, start + PAGE_SIZE);
  });

  protected readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

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

  prev(): void { if (this.page() > 1) this.page.update(p => p - 1); }
  next(): void { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }

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
