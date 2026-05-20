import { Permission } from './permission.model';

export type RoleColor = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'dark' | 'teal';

export interface Role {
  id: number;
  name: string;
  color: RoleColor;
  permissionIds: number[];
}

export interface CreateRolePayload {
  name: string;
  color?: RoleColor;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}
