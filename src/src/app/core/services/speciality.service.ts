import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, throwError, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSpecialityPayload, Speciality } from '../models/speciality.model';
import { ApiSpeciality, PaginatedResponse } from '../models/api.model';
import { toError } from '../utils/api-error';

const PAGE_SIZE = 1000;

function fromApi(s: ApiSpeciality): Speciality {
  return { id: s.id, name: s.name };
}

@Injectable({ providedIn: 'root' })
export class SpecialityService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/specialities`;

  private readonly store = signal<Speciality[]>([]);
  readonly specialities = this.store.asReadonly();

  list(): Observable<Speciality[]> {
    const params = new HttpParams().set('page', 1).set('pageSize', PAGE_SIZE);
    return this.http.get<PaginatedResponse<ApiSpeciality>>(this.baseUrl, { params }).pipe(
      map(res => res.data.map(fromApi)),
      tap(items => this.store.set(items)),
      catchError(err => throwError(() => toError(err))),
    );
  }

  getById(id: number): Speciality | undefined {
    return this.store().find(s => s.id === id);
  }

  // Pide el detalle de la especialidad a la API y refresca la copia cacheada.
  get(id: number): Observable<Speciality> {
    return this.http.get<ApiSpeciality>(`${this.baseUrl}/${id}`).pipe(
      map(fromApi),
      tap(item => this.store.update(list => list.map(s => (s.id === id ? item : s)))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  create(payload: CreateSpecialityPayload): Observable<Speciality> {
    return this.http.post<ApiSpeciality>(this.baseUrl, { name: payload.name }).pipe(
      map(fromApi),
      tap(created => this.store.update(list => [...list, created])),
      catchError(err => throwError(() => toError(err))),
    );
  }

  update(id: number, payload: CreateSpecialityPayload): Observable<Speciality> {
    return this.http.put<ApiSpeciality>(`${this.baseUrl}/${id}`, { name: payload.name }).pipe(
      map(fromApi),
      tap(updated => this.store.update(list => list.map(s => (s.id === id ? updated : s)))),
      catchError(err => throwError(() => toError(err))),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      map(() => undefined),
      tap(() => this.store.update(list => list.filter(s => s.id !== id))),
      catchError(err => throwError(() => toError(err))),
    );
  }
}
