export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  roleIds: number[];
  specialityIds: number[];
  locationIds: number[];
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleIds?: number[];
  specialityIds?: number[];
  locationIds?: number[];
}
