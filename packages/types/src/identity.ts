// ─── Identity Domain ───────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface Role {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope?: PermissionScope;
}

export type PermissionScope = 'tenant' | 'site' | 'warehouse' | 'team';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: 'factory' | 'warehouse' | 'office';
  address?: string;
}

export interface Team {
  id: string;
  siteId: string;
  name: string;
  leadUserId?: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
}
