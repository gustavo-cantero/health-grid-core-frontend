import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserPayload, UpdateUserPayload, User } from '../models/user.model';

const SEED: User[] = [
  {
    id: 1, firstName: 'María', lastName: 'Alvarez', email: 'm.alvarez@healthgrid.com',
    createdAt: '2025-01-12T00:00:00Z',
    roleIds: [2], specialityIds: [1], locationIds: [1],
  },
  {
    id: 2, firstName: 'Juan', lastName: 'Rodríguez', email: 'j.rodriguez@healthgrid.com',
    createdAt: '2025-03-03T00:00:00Z',
    roleIds: [1], specialityIds: [], locationIds: [1, 2],
  },
  {
    id: 3, firstName: 'Sandra', lastName: 'López', email: 's.lopez@healthgrid.com',
    createdAt: '2025-04-20T00:00:00Z',
    roleIds: [3], specialityIds: [], locationIds: [2],
  },
  {
    id: 4, firstName: 'Carlos', lastName: 'Pérez', email: 'c.perez@healthgrid.com',
    createdAt: '2025-02-15T00:00:00Z',
    roleIds: [2], specialityIds: [2], locationIds: [1],
  },
];

const FAKE_DELAY_MS = 300;

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly baseUrl = `${environment.apiBaseUrl}/users`;

  private readonly store = signal<User[]>(SEED);
  readonly users = this.store.asReadonly();

  list(): Observable<User[]> {
    return of(this.store()).pipe(delay(FAKE_DELAY_MS));
  }

  getById(id: number): User | undefined {
    return this.store().find(u => u.id === id);
  }

  create(payload: CreateUserPayload): Observable<User> {
    const nextId = this.store().reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const created: User = {
      id: nextId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      createdAt: new Date().toISOString(),
      roleIds: [], specialityIds: [], locationIds: [],
    };
    this.store.update(list => [...list, created]);
    return of(created).pipe(delay(FAKE_DELAY_MS));
  }

  update(id: number, patch: UpdateUserPayload): Observable<User> {
    let updated!: User;
    this.store.update(list =>
      list.map(u => {
        if (u.id !== id) return u;
        updated = { ...u, ...patch };
        return updated;
      }),
    );
    return of(updated).pipe(delay(FAKE_DELAY_MS));
  }

  remove(id: number): Observable<void> {
    this.store.update(list => list.filter(u => u.id !== id));
    return of(undefined).pipe(delay(FAKE_DELAY_MS));
  }

  assignRole(userId: number, roleId: number): Observable<void> {
    return this.toggleId(userId, 'roleIds', roleId, true);
  }
  removeRole(userId: number, roleId: number): Observable<void> {
    return this.toggleId(userId, 'roleIds', roleId, false);
  }
  assignSpeciality(userId: number, specialityId: number): Observable<void> {
    return this.toggleId(userId, 'specialityIds', specialityId, true);
  }
  removeSpeciality(userId: number, specialityId: number): Observable<void> {
    return this.toggleId(userId, 'specialityIds', specialityId, false);
  }
  assignLocation(userId: number, locationId: number): Observable<void> {
    return this.toggleId(userId, 'locationIds', locationId, true);
  }
  removeLocation(userId: number, locationId: number): Observable<void> {
    return this.toggleId(userId, 'locationIds', locationId, false);
  }

  private toggleId(
    userId: number,
    field: 'roleIds' | 'specialityIds' | 'locationIds',
    value: number,
    add: boolean,
  ): Observable<void> {
    this.store.update(list =>
      list.map(u => {
        if (u.id !== userId) return u;
        const current = u[field];
        const next = add
          ? (current.includes(value) ? current : [...current, value])
          : current.filter(v => v !== value);
        return { ...u, [field]: next };
      }),
    );
    return of(undefined).pipe(delay(FAKE_DELAY_MS));
  }
}
