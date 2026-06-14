// Raw shapes returned by the Core API (snake_case, nested objects).
// These are mapped to the front-end models inside each service.

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pagination: { page: number; pageSize: number };
}

export interface ApiPermission {
  id: number;
  name: string;
  deleted_at?: string | null;
}

export interface ApiRole {
  id: number;
  name: string;
  deleted_at?: string | null;
  permissions?: ApiPermission[];
}

export interface ApiSpeciality {
  id: number;
  name: string;
  deleted_at?: string | null;
}

export interface ApiLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  deleted_at?: string | null;
}

export interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  roles?: ApiRole[];
  locations?: ApiLocation[];
  specialities?: ApiSpeciality[];
}

export interface ApiAuthResponse {
  token: string;
  user: ApiUser;
}

export interface ApiError {
  error: string;
}
