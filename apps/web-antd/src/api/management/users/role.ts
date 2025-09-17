// 文件路径: src/api/management/role.ts

import type {
  RoleCreateData,
  RoleListParams,
  RoleReadWithPermissions,
  RoleSelectorItem,
  RoleUpdateData,
  BatchRoleActionPayload, // 新增
  RoleMergePayload,       // 新增
} from '#/views/management/role/types';
import type { StandardResponse, PageResponse } from '#/api/types';
import { requestClient } from '#/api/request';

const API_PREFIX = '/role';

// --- 核心 CRUD ---
export function listRolesPaginated(params: RoleListParams) {
  return requestClient.get<StandardResponse<PageResponse<RoleReadWithPermissions>>>(
    `${API_PREFIX}/`, { params },
  );
}

export function getRoleDetails(roleId: string, params?: { view_mode: string }) {
  return requestClient.get<StandardResponse<RoleReadWithPermissions>>(
    `${API_PREFIX}/${roleId}`, { params },
  );
}

export function createRole(data: RoleCreateData) {
  return requestClient.post<StandardResponse<RoleReadWithPermissions>>(`${API_PREFIX}/`, data);
}

export function updateRole(roleId: string, data: RoleUpdateData) {
  return requestClient.put<StandardResponse<RoleReadWithPermissions>>(
    `${API_PREFIX}/${roleId}`, data,
  );
}

// --- 生命周期管理 ---
export function softDeleteRoles(data: BatchRoleActionPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(
    `${API_PREFIX}/`, { data },
  );
}

export function restoreRoles(data: BatchRoleActionPayload) {
  return requestClient.post<StandardResponse<{ restored_count: number }>>(
    `${API_PREFIX}/restore`, data,
  );
}

export function permanentDeleteRoles(data: BatchRoleActionPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(
    `${API_PREFIX}/permanent`, { data },
  );
}

// --- 高级工具 ---
export function mergeRoles(data: RoleMergePayload) {
  return requestClient.post<StandardResponse<RoleReadWithPermissions>>(`${API_PREFIX}/merge`, data);
}

// --- UI 辅助 ---
export function getRolesForSelector() {
  return requestClient.get<StandardResponse<RoleSelectorItem[]>>(`${API_PREFIX}/selector`);
}
