import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Location } from '../../../core/models/location.model';
import { LocationFormModalComponent } from './location-form-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-locations-list',
  imports: [LocationFormModalComponent, ConfirmDeleteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-eyebrow">Gestión</div>
    <h1 class="page-title">Ubicaciones</h1>
    <p class="page-subtitle">Gestioná las sedes y consultorios de la red de salud.</p>

    <div style="text-align:right;margin-bottom:16px">
      <button type="button" class="btn-main" (click)="openCreate.set(true)">+ Nueva ubicación</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nombre</th>
            <th scope="col">Dirección</th>
            <th scope="col">Ciudad</th>
            <th scope="col">País</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (l of locations(); track l.id) {
            <tr>
              <td class="cell-id">#{{ l.id }}</td>
              <td style="font-weight:700">{{ l.name }}</td>
              <td class="cell-muted">{{ l.address }}</td>
              <td>{{ l.city }}</td>
              <td>{{ l.country }}</td>
              <td>
                <div class="actions">
                  <button type="button" class="btn-outline" (click)="editing.set(l)">Editar</button>
                  <button type="button" class="btn-danger" (click)="deleting.set(l)">Eliminar</button>
                </div>
              </td>
            </tr>
          }
          @if (locations().length === 0) {
            <tr><td colspan="6" class="empty-state">No hay ubicaciones definidas.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <app-location-form-modal
      [open]="openCreate()"
      [existing]="null"
      (close)="openCreate.set(false)"
      (saved)="onCreated($event)"
    />

    <app-location-form-modal
      [open]="editing() !== null"
      [existing]="editing()"
      (close)="editing.set(null)"
      (saved)="onUpdated($event)"
    />

    <app-confirm-delete
      [open]="deleting() !== null"
      entityLabel="ubicación"
      (cancel)="deleting.set(null)"
      (confirm)="confirmDelete()"
    />
  `,
})
export class LocationsListComponent implements OnInit {
  private readonly locService = inject(LocationService);
  private readonly toast = inject(ToastService);

  protected readonly locations = this.locService.locations;
  protected readonly openCreate = signal<boolean>(false);
  protected readonly editing = signal<Location | null>(null);
  protected readonly deleting = signal<Location | null>(null);

  ngOnInit(): void {
    this.locService.list().subscribe();
  }

  onCreated(l: Location): void {
    this.openCreate.set(false);
    this.toast.show(`Ubicación "${l.name}" creada correctamente`);
  }

  onUpdated(l: Location): void {
    this.editing.set(null);
    this.toast.show(`Ubicación "${l.name}" actualizada correctamente`);
  }

  confirmDelete(): void {
    const l = this.deleting();
    if (!l) return;
    this.locService.remove(l.id).subscribe(() => {
      this.deleting.set(null);
      this.toast.show('Ubicación eliminada (soft delete aplicado)');
    });
  }
}
