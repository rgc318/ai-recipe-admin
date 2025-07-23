// 文件路径: src/views/management/permission/types.ts

/**
 * @description 从后端 API 读取权限数据时使用的标准模型。
 * 这个接口的字段应该与后端 Pydantic 的 PermissionRead schema 完全匹配。
 */
export interface PermissionRead {
  id: string; // UUID 在前端通常处理为字符串
  code: string; // 权限的唯一代码, e.g., "management:user:list"
  name: string; // 权限的显示名称, e.g., "查看用户列表"
  group?: string; // 所属模块/分组, e.g., "用户管理"
  description?: string | null; // 权限的详细描述
}

/**
 * @description 调用“同步权限”接口后，后端返回的响应数据模型。
 * 这个接口的字段应该与后端 Pydantic 的 PermissionSyncResponse schema 完全匹配。
 */
export interface PermissionSyncResponse {
  total: number; // 本次同步请求中包含的权限总数
  found: number; // 在数据库中已存在的权限数量
  created: number; // 本次同步中新创建的权限数量
  // created_items?: PermissionRead[]; // (可选) 后端可能会返回新创建项的详细列表
}

export interface PermissionSelector {
  id: string;
  name: string;
}
