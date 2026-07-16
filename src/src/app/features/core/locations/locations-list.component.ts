import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

const PAGE_SIZE = 10;
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Location } from '../../../core/models/location.model';
import { LocationFormModalComponent } from './location-form-modal.component';
import { ConfirmDeleteComponent } from '../../../shared/ui/confirm-delete/confirm-delete.component';
import { HasPermissionDirective } from '../../../core/auth/has-permission.directive';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';

@Component({
  selector: 'app-locations-list',
  imports: [
    LocationFormModalComponent,
    ConfirmDeleteComponent,
    HasPermissionDirective,
    PaginationComponent,
  ],
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
  protected readonly page = signal<number>(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.locations().length / PAGE_SIZE)),
  );

  protected readonly paged = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.locations().slice(start, start + PAGE_SIZE);
  });

  ngOnInit(): void {
    this.locService.list().subscribe();
  }

  onCreated(l: Location): void {
    this.openCreate.set(false);
    this.toast.show(`Ubicación "${l.name}" creada correctamente`);
  }

  // Pide el detalle de la ubicación a la API antes de abrir el modal de edición.
  edit(l: Location): void {
    this.locService.get(l.id).subscribe(detail => this.editing.set(detail));
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
