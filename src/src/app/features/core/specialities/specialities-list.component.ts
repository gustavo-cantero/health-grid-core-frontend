import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { SpecialityService } from '../../../core/services/speciality.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Speciality } from '../../../core/models/speciality.model';
import { SpecialityFormModalComponent } from './speciality-form-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-specialities-list',
  imports: [SpecialityFormModalComponent, ConfirmDeleteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-eyebrow">Gestión</div>
    <h1 class="page-title">Especialidades</h1>
    <p class="page-subtitle">Administrá las especialidades médicas disponibles en el sistema.</p>

    <div style="text-align:right;margin-bottom:16px">
      <button type="button" class="btn-main" (click)="openCreate.set(true)">+ Nueva especialidad</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nombre</th>
            <th scope="col">Médicos asignados</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (s of specialities(); track s.id) {
            <tr>
              <td class="cell-id">#{{ s.id }}</td>
              <td><span class="badge badge-blue">{{ s.name }}</span></td>
              <td>{{ doctorCount(s.id) }}</td>
              <td>
                <div class="actions">
                  <button type="button" class="btn-outline" (click)="editing.set(s)">Editar</button>
                  <button type="button" class="btn-danger" (click)="deleting.set(s)">Eliminar</button>
                </div>
              </td>
            </tr>
          }
          @if (specialities().length === 0) {
            <tr><td colspan="4" class="empty-state">No hay especialidades definidas.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <app-speciality-form-modal
      [open]="openCreate()"
      [existing]="null"
      (close)="openCreate.set(false)"
      (saved)="onCreated($event)"
    />

    <app-speciality-form-modal
      [open]="editing() !== null"
      [existing]="editing()"
      (close)="editing.set(null)"
      (saved)="onUpdated($event)"
    />

    <app-confirm-delete
      [open]="deleting() !== null"
      entityLabel="especialidad"
      (cancel)="deleting.set(null)"
      (confirm)="confirmDelete()"
    />
  `,
})
export class SpecialitiesListComponent implements OnInit {
  private readonly specService = inject(SpecialityService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  protected readonly specialities = this.specService.specialities;
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<Speciality | null>(null);
  protected readonly deleting = signal<Speciality | null>(null);

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
