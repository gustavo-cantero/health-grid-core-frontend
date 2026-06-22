import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, tap, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminCreateUserPayload, UpdateUserPayload, User } from '../models/user.model';
import { ApiUser, PaginatedResponse } from '../models/api.model';
import { toError } from '../utils/api-error';
import { colorForId } from './role.service';

const PAGE_SIZE = 1000;

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/users`;

  private readonly store = signal<User[]>([]);
  readonly users = this.store.asReadonly();

  list(): Observable<User[]> {
    const params = new HttpParams().set('page', 1).set('pageSize', PAGE_SIZE);
    return this.http.get<PaginatedResponse<ApiUser>>(this.baseUrl, { params }).pipe(
      map((res) => res.data.map(fromApi)),
      tap((users) => this.store.set(users)),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  getById(id: number): User | undefined {
    return this.store().find((u) => u.id === id);
  }

  // Pide el detalle del usuario a la API y refresca la copia cacheada.
  get(id: number): Observable<User> {
    return this.http.get<ApiUser>(`${this.baseUrl}/${id}`).pipe(
      map(fromApi),
      tap((user) => this.store.update((list) => list.map((u) => (u.id === id ? user : u)))),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  create(payload: AdminCreateUserPayload): Observable<User> {
    const body = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
    };
    return this.http.post<ApiUser>(this.baseUrl, body).pipe(
      map(fromApi),
      tap((created) => this.store.update((list) => [...list, created])),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  resendVerification(id: number): Observable<void> {
    return this.http.post(`${this.baseUrl}/${id}/resend-verification`, {}).pipe(
      map(() => undefined),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  update(id: number, patch: UpdateUserPayload): Observable<User> {
    const current = this.getById(id);
    const calls: Observable<unknown>[] = [];

    if (
      patch.firstName !== undefined ||
      patch.lastName !== undefined ||
      patch.email !== undefined
    ) {
      const body: Record<string, string> = {};
      if (patch.firstName !== undefined) body['first_name'] = patch.firstName;
      if (patch.lastName !== undefined) body['last_name'] = patch.lastName;
      if (patch.email !== undefined) body['email'] = patch.email;
      calls.push(this.http.put<ApiUser>(`${this.baseUrl}/${id}`, body));
    }

    if (patch.roleIds !== undefined) {
      this.collectRelationCalls(
        calls,
        id,
        'roles',
        'role_id',
        current?.roleIds ?? [],
        patch.roleIds,
      );
    }
    if (patch.specialityIds !== undefined) {
      this.collectRelationCalls(
        calls,
        id,
        'specialities',
        'speciality_id',
        current?.specialityIds ?? [],
        patch.specialityIds,
      );
    }
    if (patch.locationIds !== undefined) {
      this.collectRelationCalls(
        calls,
        id,
        'locations',
        'location_id',
        current?.locationIds ?? [],
        patch.locationIds,
      );
    }

    const ops$: Observable<unknown> = calls.length ? forkJoin(calls) : of(null);
    return ops$.pipe(
      switchMap(() => this.http.get<ApiUser>(`${this.baseUrl}/${id}`)),
      map(fromApi),
      tap((updated) => this.store.update((list) => list.map((u) => (u.id === id ? updated : u)))),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      tap(() => this.store.update((list) => list.filter((u) => u.id !== id))),
      catchError((err) => throwError(() => toError(err))),
    );
  }

  assignRole(userId: number, roleId: number): Observable<void> {
    return this.relation('post', userId, 'roles', { role_id: roleId });
  }
  removeRole(userId: number, roleId: number): Observable<void> {
    return this.relation('delete', userId, `roles/${roleId}`);
  }
  assignSpeciality(userId: number, specialityId: number): Observable<void> {
    return this.relation('post', userId, 'specialities', { speciality_id: specialityId });
  }
  removeSpeciality(userId: number, specialityId: number): Observable<void> {
    return this.relation('delete', userId, `specialities/${specialityId}`);
  }
  assignLocation(userId: number, locationId: number): Observable<void> {
    return this.relation('post', userId, 'locations', { location_id: locationId });
  }
  removeLocation(userId: number, locationId: number): Observable<void> {
    return this.relation('delete', userId, `locations/${locationId}`);
  }

  private collectRelationCalls(
    calls: Observable<unknown>[],
    userId: number,
    resource: 'roles' | 'specialities' | 'locations',
    idKey: 'role_id' | 'speciality_id' | 'location_id',
    currentIds: number[],
    nextIds: number[],
  ): void {
    for (const value of nextIds.filter((v) => !currentIds.includes(v))) {
      calls.push(this.http.post(`${this.baseUrl}/${userId}/${resource}`, { [idKey]: value }));
    }
    for (const value of currentIds.filter((v) => !nextIds.includes(v))) {
      calls.push(this.http.delete(`${this.baseUrl}/${userId}/${resource}/${value}`));
    }
  }

  private relation(
    method: 'post' | 'delete',
    userId: number,
    path: string,
    body?: Record<string, number>,
  ): Observable<void> {
    const url = `${this.baseUrl}/${userId}/${path}`;
    const req$ = method === 'post' ? this.http.post(url, body ?? {}) : this.http.delete(url);
    return req$.pipe(
      map(() => undefined),
      catchError((err) => throwError(() => toError(err))),
    );
  }
}

function fromApi(apiUser: ApiUser): User {
  const roles = apiUser.roles ?? [];
  const specialities = apiUser.specialities ?? [];
  const locations = apiUser.locations ?? [];
  return {
    id: apiUser.id,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    email: apiUser.email,
    createdAt: apiUser.created_at,
    hasCredentials: apiUser.has_credentials,
    roleIds: roles.map((r) => r.id),
    specialityIds: specialities.map((s) => s.id),
    locationIds: locations.map((l) => l.id),
    roles: roles.map((r) => ({ id: r.id, name: r.name, color: colorForId(r.id) })),
    specialities: specialities.map((s) => ({ id: s.id, name: s.name })),
    locations: locations.map((l) => ({ id: l.id, name: l.name })),
  };
}
