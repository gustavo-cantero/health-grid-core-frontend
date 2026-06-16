import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePermissionPayload, Permission } from '../models/permission.model';
import { ApiPermission, PaginatedResponse } from '../models/api.model';
import { toError } from '../utils/api-error';

const PAGE_SIZE = 1000;

function fromApi(p: ApiPermission): Permission {
  return { id: p.id, name: p.name };
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/permissions`;

  private readonly store = signal<Permission[]>([]);
  readonly permissions = this.store.asReadonly();

  list(): Observable<Permission[]> {
    const params = new HttpParams().set('page', 1).set('pageSize', PAGE_SIZE);
    return this.http.get<PaginatedResponse<ApiPermission>>(this.baseUrl, { params }).pipe(
      map(res => res.data.map(fromApi)),
      tap(items => this.store.set(items)),
      catchError(err => throwError(() => toError(err))),
    );
  }

  getById(id: number): Permission | undefined {
    return this.store().find(p => p.id === id);
  }

  // Pide el detalle del permiso a la API y refresca la copia cacheada.
  get(id: number): Observable<Permission> {
    return this.http.get<ApiPermission>(`${this.baseUrl}/${id}`).pipe(
      map(fromApi),
      tap(item => this.store.update(list => list.map(p => (p.id === id ? item : p)))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  create(payload: CreatePermissionPayload): Observable<Permission> {
    return this.http.post<ApiPermission>(this.baseUrl, { name: payload.name }).pipe(
      map(fromApi),
      tap(created => this.store.update(list => [...list, created])),
      catchError(err => throwError(() => toError(err))),
    );
  }

  update(id: number, payload: CreatePermissionPayload): Observable<Permission> {
    return this.http.put<ApiPermission>(`${this.baseUrl}/${id}`, { name: payload.name }).pipe(
      map(fromApi),
      tap(updated => this.store.update(list => list.map(p => (p.id === id ? updated : p)))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      tap(() => this.store.update(list => list.filter(p => p.id !== id))),
      catchError(err => throwError(() => toError(err))),
    );
  }
}
