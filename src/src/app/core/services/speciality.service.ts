import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSpecialityPayload, Speciality } from '../models/speciality.model';

const SEED: Speciality[] = [
  { id: 1, name: 'Cardiología' },
  { id: 2, name: 'Neurología' },
  { id: 3, name: 'Clínica médica' },
  { id: 4, name: 'Pediatría' },
  { id: 5, name: 'Traumatología' },
];

const FAKE_DELAY_MS = 250;

@Injectable({ providedIn: 'root' })
export class SpecialityService {
  readonly baseUrl = `${environment.apiBaseUrl}/specialities`;

  private readonly store = signal<Speciality[]>(SEED);
  readonly specialities = this.store.asReadonly();

  list(): Observable<Speciality[]> {
    return of(this.store()).pipe(delay(FAKE_DELAY_MS));
  }

  getById(id: number): Speciality | undefined {
    return this.store().find(s => s.id === id);
  }

  create(payload: CreateSpecialityPayload): Observable<Speciality> {
    const nextId = this.store().reduce((max, s) => Math.max(max, s.id), 0) + 1;
    const created: Speciality = { id: nextId, name: payload.name };
    this.store.update(list => [...list, created]);
    return of(created).pipe(delay(FAKE_DELAY_MS));
  }

  update(id: number, payload: CreateSpecialityPayload): Observable<Speciality> {
    let updated!: Speciality;
    this.store.update(list =>
      list.map(s => {
        if (s.id !== id) return s;
        updated = { ...s, name: payload.name };
        return updated;
      }),
    );
    return of(updated).pipe(delay(FAKE_DELAY_MS));
  }

  remove(id: number): Observable<void> {
    this.store.update(list => list.filter(s => s.id !== id));
    return of(undefined).pipe(delay(FAKE_DELAY_MS));
  }
}
