import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Location } from '../../../core/models/location.model';
import { LocationFormModalComponent } from './location-form-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-locations-list',
  imports: [LocationFormModalComponent, ConfirmDeleteComponent],
  templateUrl: './locations-list.component.html',
  styleUrls: ['./locations-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
