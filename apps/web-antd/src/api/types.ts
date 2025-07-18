// 文件路径: src/api/types.ts

/**
 * @description 分页响应的通用结构
 * T - 代表列表中具体项目的类型，例如 UserItem 或 RoleItem
 */
export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * @description API响应的最外层通用结构
 * T - 代表 data 字段中具体业务数据的类型
 */
export interface StandardResponse<T> {
  code: number;
  message: string;
  data: T;
}
