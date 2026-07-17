// Strings de permisos tal cual aparecen en el claim `permissions` del JWT.
// Cada acción de la UI mapea a uno de estos; ver HasPermissionDirective / permissionGuard.

export const PERMISSIONS = {
  users: {
    read: 'users:read',
    create: 'users:create',
    write: 'users:write',
    delete: 'users:delete',
    rolesManage: 'users:roles:manage',
    locationsManage: 'users:locations:manage',
    specialitiesManage: 'users:specialities:manage',
    passwordSelf: 'users:password:self',
  },
  roles: {
    read: 'roles:read',
    manage: 'roles:manage',
    permissionsManage: 'roles:permissions:manage',
  },
  permissions: {
    read: 'permissions:read',
    manage: 'permissions:manage',
  },
  specialities: {
    read: 'specialities:read',
    manage: 'specialities:manage',
  },
  locations: {
    read: 'locations:read',
    manage: 'locations:manage',
  },
} as const;

/** Un módulo core expuesto en la UI, controlado por su permiso de lectura. */
export interface ModuleDef {
  key: string;
  label: string;
  path: string;
  read: string;
}

// Los cinco módulos core. Cada uno se muestra y se accede solo con su permiso
// de lectura; no tener ninguno no impide iniciar sesión.
export const CORE_MODULES: readonly ModuleDef[] = [
  { key: 'users', label: 'Usuarios', path: '/core/users', read: PERMISSIONS.users.read },
  { key: 'roles', label: 'Roles', path: '/core/roles', read: PERMISSIONS.roles.read },
  {
    key: 'permissions',
    label: 'Permisos',
    path: '/core/permissions',
    read: PERMISSIONS.permissions.read,
  },
  {
    key: 'specialities',
    label: 'Especialidades',
    path: '/core/specialities',
    read: PERMISSIONS.specialities.read,
  },
  {
    key: 'locations',
    label: 'Ubicaciones',
    path: '/core/locations',
    read: PERMISSIONS.locations.read,
  },
];
