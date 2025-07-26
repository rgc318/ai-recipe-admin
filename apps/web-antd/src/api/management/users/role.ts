// 文件路径: src/api/management/role.ts

import type {
  RoleCreateData,
  RoleItem,
  RoleListParams, RolePermissionsUpdateData, RoleReadWithPermissions,
  RoleSelectorItem, RoleUpdateData,
  RoleWithPermissions
} from '#/views/management/role/types';
import type { StandardResponse, PageResponse } from '#/api/types'; // 建议将通用的分页类型提取出来

import { requestClient } from '#/api/request';


const API_PREFIX = '/role'; // 后端角色 API 主路径

/**
 * @description 获取角色列表 (带分页)
 * @param params - 查询参数，例如 { page: 1, pageSize: 10, name: 'admin' }
 */
export function getRoleList(params: any) {
  // 注意：这里的返回类型，我使用了与您后端完全匹配的、更精确的 PageResponse 类型
  // 这比 user.ts 中的 { list, total } 更准确
  return requestClient.get<StandardResponse<PageResponse<RoleItem>>>(
    API_PREFIX,
    { params },
  );
}

/**
 * @description 获取用于下拉选择框的轻量级角色列表
 * @returns 只包含 id 和 name 的角色数组
 */
export function getRolesForSelector() {
  return requestClient.get<StandardResponse<RoleSelectorItem[]>>(`${API_PREFIX}/selector`);
}

/**
 * @description 获取角色列表 (分页、排序、过滤)
 * @param params - 查询参数
 * @returns 分页后的角色列表
 */
export function getRoleListPage(params: RoleListParams) {
  return requestClient.get<StandardResponse<PageResponse<RoleItem>>>(
    `${API_PREFIX}/`, // 后端路径是 '/'
    { params },
  );
}

/**
 * @description 获取单个角色的详细信息，包含其所有权限
 * @param roleId - 角色的UUID
 * @returns 包含权限列表的角色详情
 */
export function getRoleDetails(roleId: string) {
  return requestClient.get<StandardResponse<RoleWithPermissions>>(`${API_PREFIX}/${roleId}`);
}

/**
 * @description 创建新角色
 * @param data - 创建角色的数据
 */
export function createRole(data: RoleCreateData) {
  // 返回带权限详情的角色信息，方便前端直接更新状态
  return requestClient.post<StandardResponse<RoleItem>>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新角色信息 (可同时更新基础信息和权限)
 * @param roleId - 角色的UUID
 * @param data - 更新的数据
 * @returns 更新后的角色完整信息（含权限）
 */
export function updateRole(roleId: string, data: RoleUpdateData) {
  return requestClient.put<StandardResponse<RoleWithPermissions>>(
    `${API_PREFIX}/${roleId}`,
    data,
  );
}

/**
 * @description (软)删除角色
 * @param roleId - 角色的UUID
 */
export function deleteRole(roleId: string) {
  // 204 No Content，响应体为空
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${roleId}`);
}


// --- 角色与权限的关联管理 API ---

/**
 * @description 批量设置(覆盖)一个角色的所有权限
 * @param roleId - 角色的UUID
 * @param data - 包含权限ID列表的对象
 * @returns 更新后的角色完整信息（含权限）
 */
export function setRolePermissions(roleId: string, data: RolePermissionsUpdateData) {
  return requestClient.put<StandardResponse<RoleWithPermissions>>(
    `${API_PREFIX}/${roleId}/permissions`,
    data,
  );
}

/**
 * @description 为角色分配单个权限 (增量添加)
 * @param roleId - 角色的UUID
 * @param permissionId - 权限的UUID
 * @returns 更新后的角色完整信息（含权限）
 */
export function assignPermissionToRole(roleId: string, permissionId: string) {
  return requestClient.post<StandardResponse<RoleWithPermissions>>(
    `${API_PREFIX}/${roleId}/permissions/${permissionId}`,
  );
}

/**
 * @description 从角色中撤销单个权限
 * @param roleId - 角色的UUID
 * @param permissionId - 权限的UUID
 * @returns 更新后的角色完整信息（含权限）
 */
export function revokePermissionFromRole(roleId: string, permissionId: string) {
  return requestClient.delete<StandardResponse<RoleWithPermissions>>(
    `${API_PREFIX}/${roleId}/permissions/${permissionId}`,
  );
}

// =================================================================
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 核心修改点 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// =================================================================
/**
 * 【全新实现】获取角色列表 (支持动态分页、排序、过滤)
 * 这是新的主查询函数，替换旧的 getRoleListPage
 * @param params - 强类型的查询参数对象 (RoleListParams)
 * @returns 分页后的角色列表，且每个角色都包含权限详情
 */
export function listRolesPaginated(params: RoleListParams) {
  return requestClient.get<StandardResponse<PageResponse<RoleReadWithPermissions>>>(
    `${API_PREFIX}/`, // 后端路径是 '/'
    { params },
  );
}
// =================================================================

