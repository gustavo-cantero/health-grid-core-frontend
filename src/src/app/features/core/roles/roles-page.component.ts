import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Role } from '../../../core/models/role.model';
import { RoleCreateModalComponent } from './role-create-modal.component';
import { RoleEditModalComponent } from './role-edit-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';
import { HasPermissionDirective } from '../../../core/auth/has-permission.directive';

const PAGE_SIZE = 10;

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
  private readonly toast = inject(ToastService);

  protected readonly roles = this.roleService.roles;

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

  ngOnInit(): void {
    // /roles ya trae los usuarios anidados, así que el conteo sale de ahí.
    this.roleService.list().subscribe();
  }

  prev(): void {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }
  next(): void {
    if (this.page() < this.totalPages()) this.page.update((p) => p + 1);
  }

  onCreated(role: Role): void {
    this.openCreate.set(false);
    this.toast.show(`Rol "${role.name}" creado correctamente`);
  }

  // Pide el detalle del rol a la API antes de abrir el modal de edición.
  edit(r: Role): void {
    this.roleService.get(r.id).subscribe((detail) => this.editing.set(detail));
  }

  onUpdated(_role: Role): void {
    this.editing.set(null);
  }

  confirmDelete(): void {
    const r = this.deleting();
    if (!r) return;
    this.roleService.remove(r.id).subscribe(() => {
      this.deleting.set(null);
      this.toast.show('Rol eliminado (soft delete aplicado)');
    });
  }
}
