import { RoleColor } from './role.model';

// Referencia liviana para mostrar nombres en los listados sin tener que
// cruzar contra los catálogos completos (los datos ya vienen anidados en /users).
export interface EntityRef {
  id: number;
  name: string;
}

export interface UserRoleRef extends EntityRef {
  color: RoleColor;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  hasCredentials: boolean;
  roleIds: number[];
  specialityIds: number[];
  locationIds: number[];
  // Datos anidados que devuelve la API, listos para mostrar en la tabla.
  roles: UserRoleRef[];
  specialities: EntityRef[];
  locations: EntityRef[];
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AdminCreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleIds?: number[];
  specialityIds?: number[];
  locationIds?: number[];
}
