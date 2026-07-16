import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

const PAGE_SIZE = 10;
import { SpecialityService } from '../../../core/services/speciality.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Speciality } from '../../../core/models/speciality.model';
import { SpecialityFormModalComponent } from './speciality-form-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';
import { HasPermissionDirective } from '../../../core/auth/has-permission.directive';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';

@Component({
  selector: 'app-specialities-list',
  imports: [
    SpecialityFormModalComponent,
    ConfirmDeleteComponent,
    HasPermissionDirective,
    PaginationComponent,
  ],
  templateUrl: './specialities-list.component.html',
  styleUrls: ['./specialities-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialitiesListComponent implements OnInit {
  private readonly specService = inject(SpecialityService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  protected readonly specialities = this.specService.specialities;
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<Speciality | null>(null);
  protected readonly deleting = signal<Speciality | null>(null);
  protected readonly page = signal<number>(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.specialities().length / PAGE_SIZE)),
  );

  protected readonly paged = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.specialities().slice(start, start + PAGE_SIZE);
  });

  private readonly countMap = computed(() => {
    const map = new Map<number, number>();
    for (const u of this.userService.users()) {
      for (const sid of u.specialityIds) {
        map.set(sid, (map.get(sid) ?? 0) + 1);
      }
    }
    return map;
  });

  ngOnInit(): void {
    this.specService.list().subscribe();
    this.userService.list().subscribe();
  }

  doctorCount(specId: number): number {
    return this.countMap().get(specId) ?? 0;
  }

  onCreated(s: Speciality): void {
    this.openCreate.set(false);
    this.toast.show(`Especialidad "${s.name}" creada correctamente`);
  }

  // Pide el detalle de la especialidad a la API antes de abrir el modal de edición.
  edit(s: Speciality): void {
    this.specService.get(s.id).subscribe(detail => this.editing.set(detail));
  }

  onUpdated(s: Speciality): void {
    this.editing.set(null);
    this.toast.show(`Especialidad "${s.name}" actualizada correctamente`);
  }

  confirmDelete(): void {
    const s = this.deleting();
    if (!s) return;
    this.specService.remove(s.id).subscribe(() => {
      this.deleting.set(null);
      this.toast.show('Especialidad eliminada (soft delete aplicado)');
    });
  }
}
