import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RoleService } from '../../../core/services/role.service';
import { PermissionService } from '../../../core/services/permission.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Role } from '../../../core/models/role.model';
import { RoleCreateModalComponent } from './role-create-modal.component';
import { RoleEditModalComponent } from './role-edit-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';
import { HasPermissionDirective } from '../../../core/auth/has-permission.directive';
import { AuthService } from '../../../core/services/auth.service';
import { PERMISSIONS } from '../../../core/auth/permissions';

const PAGE_SIZE = 10;

type RolesTab = 'list' | 'matrix';

@Component({
  selector: 'app-roles-page',
  imports: [
    RoleCreateModalComponent,
    RoleEditModalComponent,
    ConfirmDeleteComponent,
    HasPermissionDirective,
  ],
  templateUrl: './roles-page.component.html',
  styleUrls: ['./roles-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPageComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly permService = inject(PermissionService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  protected readonly roles = this.roleService.roles;
  protected readonly permissions = this.permService.permissions;

  // La matriz de permisos solo es editable con roles:permissions:manage.
  protected readonly canManageRolePerms = computed(() =>
    this.auth.has(PERMISSIONS.roles.permissionsManage),
  );

  protected readonly tab = signal<RolesTab>('list');
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<Role | null>(null);
  protected readonly deleting = signal<Role | null>(null);
  protected readonly page = signal<number>(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.roles().length / PAGE_SIZE)),
  );

  protected readonly paged = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.roles().slice(start, start + PAGE_SIZE);
  });

  protected readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

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

  prev(): void {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }
  next(): void {
    if (this.page() < this.totalPages()) this.page.update((p) => p + 1);
  }

  userCount(roleId: number): number {
    return this.userCountMap().get(roleId) ?? 0;
  }

  firstPerms(role: Role, n: number) {
    const ids = role.permissionIds.slice(0, n);
    return this.permService.permissions().filter((p) => ids.includes(p.id));
  }

  isChecked(roleId: number, permId: number): boolean {
    return this.matrixDraft()[roleId]?.has(permId) ?? false;
  }

  toggleCheck(roleId: number, permId: number): void {
    this.matrixDraft.update((curr) => {
      const next = { ...curr };
      const set = new Set(next[roleId] ?? []);
      if (set.has(permId)) set.delete(permId);
      else set.add(permId);
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

  // Pide el detalle del rol a la API antes de abrir el modal de edición.
  edit(r: Role): void {
    this.roleService.get(r.id).subscribe(detail => this.editing.set(detail));
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
