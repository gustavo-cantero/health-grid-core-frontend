import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateLocationPayload, Location } from '../models/location.model';

const SEED: Location[] = [
  { id: 1, name: 'Sede Central', address: 'Av. Corrientes 1234', city: 'Buenos Aires', country: 'Argentina' },
  { id: 2, name: 'Sede Norte', address: 'Av. Santa Fe 5678', city: 'Buenos Aires', country: 'Argentina' },
  { id: 3, name: 'Sede Oeste', address: 'San Martín 900', city: 'Morón', country: 'Argentina' },
];

const FAKE_DELAY_MS = 250;

@Injectable({ providedIn: 'root' })
export class LocationService {
  readonly baseUrl = `${environment.apiBaseUrl}/locations`;

  private readonly store = signal<Location[]>(SEED);
  readonly locations = this.store.asReadonly();

  list(): Observable<Location[]> {
    return of(this.store()).pipe(delay(FAKE_DELAY_MS));
  }

  getById(id: number): Location | undefined {
    return this.store().find(l => l.id === id);
  }

  create(payload: CreateLocationPayload): Observable<Location> {
    const nextId = this.store().reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const created: Location = { id: nextId, ...payload };
    this.store.update(list => [...list, created]);
    return of(created).pipe(delay(FAKE_DELAY_MS));
  }

  update(id: number, payload: CreateLocationPayload): Observable<Location> {
    let updated!: Location;
    this.store.update(list =>
      list.map(l => {
        if (l.id !== id) return l;
        updated = { ...l, ...payload };
        return updated;
      }),
    );
    return of(updated).pipe(delay(FAKE_DELAY_MS));
  }

  remove(id: number): Observable<void> {
    this.store.update(list => list.filter(l => l.id !== id));
    return of(undefined).pipe(delay(FAKE_DELAY_MS));
  }
}
