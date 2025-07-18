// 文件路径: src/api/management/permission.ts

// 假设权限类型定义在 #/views/management/permission/types 中
import type { PermissionItem } from '#/views/management/permission/types';
import type { StandardResponse, PageResponse } from '#/api/types';

import { requestClient } from '#/api/request';

// --- 类型定义 ---

/**
 * 您的 PermissionItem 类型可能如下所示 (仅为示例):
 *
 * export interface PermissionItem {
 * id: string;
 * name: string;       // e.g., "查看用户列表"
 * code: string;       // e.g., "user:list:view"
 * group?: string;      // e.g., "用户管理"
 * description?: string;
 * createdAt: string;
 * updatedAt: string;
 * }
 */

// 创建权限时，通常不需要提交 id 和时间戳
type PermissionCreate = Omit<PermissionItem, 'id' | 'createdAt' | 'updatedAt'>;
// 更新权限时，所有字段都是可选的
type PermissionUpdate = Partial<PermissionCreate>;

const API_PREFIX = '/permission'; // 后端权限 API 主路径

/**
 * @description 获取权限列表 (带分页)
 * @param params - 查询参数，例如 { page: 1, pageSize: 10, name: '用户' }
 */
export function getPermissionList(params: any) {
  return requestClient.get<StandardResponse<PageResponse<PermissionItem>>>(
    API_PREFIX,
    { params },
  );
}

/**
 * @description 获取所有权限 (不带分页，用于为角色分配权限的穿梭框或树形控件)
 */
export function getAllPermissions() {
  // 这个接口对于构建一个功能强大的角色-权限分配界面至关重要
  return requestClient.get<StandardResponse<{ items: PermissionItem[] }>>(`${API_PREFIX}/all`);
  // 请确保后端有一个对应的 /permission/all 接口
}

/**
 * @description 创建新权限
 */
export function createPermission(data: PermissionCreate) {
  return requestClient.post<StandardResponse<PermissionItem>>(API_PREFIX, data);
}

/**
 * @description 更新权限信息
 */
export function updatePermission(id: number | string, data: PermissionUpdate) {
  return requestClient.put<StandardResponse<PermissionItem>>(
    `${API_PREFIX}/${id}`,
    data,
  );
}

/**
 * @description 删除权限
 */
export function deletePermission(id: number | string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
}
