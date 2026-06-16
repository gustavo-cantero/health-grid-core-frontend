export interface Permission {
  id: number;
  name: string;
  // Nombres de los roles que usan el permiso, derivados de los datos anidados
  // de /permissions.
  roleNames: string[];
}

export interface CreatePermissionPayload {
  name: string;
}
