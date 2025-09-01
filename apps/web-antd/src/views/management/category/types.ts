// src/views/management/category/types.ts

/**
 * @description 分类基础模型 (用于API响应)
 */
export interface CategoryRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
}

/**
 * @description 包含子节点的分类模型 (用于树形结构)
 */
export interface CategoryReadWithChildren extends CategoryRead {
  children: CategoryReadWithChildren[];
}

/**
 * @description 创建新分类的请求体数据
 */
export interface CategoryCreateData {
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
}

/**
 * @description 更新分类的请求体数据 (所有字段可选)
 */
export type CategoryUpdateData = Partial<CategoryCreateData>;

/**
 * @description 分类列表的查询参数
 */
export interface CategoryListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  name?: string; // 支持按名称模糊搜索
  slug?: string; // 支持按slug精确搜索
  parent_id?: string; // 支持按父ID搜索
}
