export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pagination: { page: number; pageSize: number };
}

export interface ApiPermission {
  id: number;
  name: string;
  deleted_at?: string | null;
  roles?: ApiRole[];
}

export interface ApiRole {
  id: number;
  name: string;
  deleted_at?: string | null;
  permissions?: ApiPermission[];
  users?: ApiUser[];
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
  has_credentials: boolean;
  roles?: ApiRole[];
  locations?: ApiLocation[];
  specialities?: ApiSpeciality[];
}

export interface ApiAuthResponse {
  token: string;
  user: ApiUser;
}

/** Respuesta de `POST /auth/sso-ticket`: ticket opaco y su vida útil en segundos. */
export interface ApiSSOTicketResponse {
  ticket: string;
  expires_in: number;
}

export interface ApiError {
  error: string;
}
