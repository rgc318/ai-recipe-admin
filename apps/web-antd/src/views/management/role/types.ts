import type {PermissionRead} from "#/views/management/permission/types";

export interface RoleItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
/**
 * 权限的基础信息 (对应后端的 PermissionRead)
 */
export interface PermissionItem {
  id: string; // UUID
  code: string;
  name: string;
  description?: string | null;
}


/**
 * 包含权限详情的角色信息 (对应后端的 RoleReadWithPermissions)
 */
export interface RoleWithPermissions extends RoleItem {
  permissions: PermissionItem[];
}

/**
 * 用于下拉选择器的轻量级角色信息 (对应后端的 RoleSelectorRead)
 */
export interface RoleSelectorItem {
  id: string; // UUID
  name: string;
}

/**
 * 创建角色时的请求体 (对应后端的 RoleCreate)
 */
export interface RoleCreateData {
  code: string;
  name: string;
  description?: string | null;
  permission_ids: string[]; // 对应 permission_ids: List[UUID]
}

/**
 * 更新角色时的请求体 (对应后端的 RoleUpdate)
 * 所有字段都是可选的
 */
export type RoleUpdateData = Partial<RoleCreateData>;


/**
 * 专门用于批量更新角色权限的请求体 (对应后端的 RolePermissionsUpdate)
 */
export interface RolePermissionsUpdateData {
  permission_ids: string[];
}

/**
 * 角色列表的查询参数 (对应后端 list_roles_paginated 的 Query 参数)
 */
export interface RoleListParams {
  page?: number;
  per_page?: number;
  order_by?: string; // 例如: "created_at:desc"
  name?: string;     // 模糊搜索
  code?: string;     // 精确过滤
}

export interface RoleRead {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RoleReadWithPermissions extends RoleRead {
  permissions: PermissionRead[];
}

export interface RoleSelector {
  id: string;
  name: string;
}

export interface RoleCreate {
  code: string;
  name:string;
  description?: string | null;
  permission_ids: string[];
}


export type RoleUpdate = Partial<RoleCreate>;

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
}
