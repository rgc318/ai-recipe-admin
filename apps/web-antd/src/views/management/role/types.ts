// 文件路径: src/views/management/role/types.ts

import type { PermissionRead } from "#/views/management/permission/types";

// --- 1. 基础与读取类型 (作为所有其他类型的基石) ---

/**
 * @description 角色的核心读取模型 (对应后端 RoleRead)
 * 这是从数据库返回的角色对象的基础形态。
 */
export interface RoleRead {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean; // <-- 确保包含软删除状态
}

/**
 * @description 包含权限详情的角色读取模型 (对应后端 RoleReadWithPermissions)
 * 用于列表和详情页。
 */
export interface RoleReadWithPermissions extends RoleRead {
  permissions: PermissionRead[];
}

/**
 * @description 用于下拉选择器的轻量级角色模型 (对应后端 RoleSelectorRead)
 */
export interface RoleSelectorItem {
  id: string;
  name: string;
}


// --- 2. API 请求/响应体 (Payloads & Data Transfer Objects) ---

/**
 * @description 创建角色时的请求体 (对应后端 RoleCreate)
 */
export interface RoleCreateData {
  code: string;
  name: string;
  description?: string | null;
  permission_ids: string[];
}

/**
 * @description 更新角色时的请求体 (对应后端 RoleUpdate)
 * 所有字段都是可选的。
 */
export type RoleUpdateData = Partial<RoleCreateData>;

/**
 * @description 角色列表的查询参数 (对应后端 API 的 Query Params)
 */
export interface RoleListParams {
  page?: number;
  per_page?: number;
  /**
   * 排序字段, 逗号分隔, -号表示降序
   * @example '-created_at,name'
   */
  sort?: string;
  /**
   * 通用搜索关键字，后端将对 name 和 code 字段进行模糊查询
   */
  search?: string;
  /**
   * 查看模式
   */
  view_mode?: 'active' | 'deleted' | 'all';
}

/**
 * @description 【新增】用于批量操作（删除、恢复）的请求体
 */
export interface BatchRoleActionPayload {
  role_ids: string[];
}

/**
 * @description 【新增】用于合并角色的请求体 (对应后端 RoleMergePayload)
 */
export interface RoleMergePayload {
  source_role_ids: string[];
  destination_role_id: string;
}
