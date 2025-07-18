export interface PermissionItem {
  id: string;
  name: string;       // e.g., "查看用户列表"
  code: string;       // e.g., "user:list:view"
  group?: string;      // e.g., "用户管理"
  description?: string;
  createdAt: string;
  updatedAt: string;
}
