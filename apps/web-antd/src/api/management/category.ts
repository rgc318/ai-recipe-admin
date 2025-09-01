// src/api/management/category.ts
import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type {
  CategoryListParams,
  CategoryRead,
  CategoryReadWithChildren,
  CategoryCreateData,
  CategoryUpdateData,
} from '#/views/category/types'; // 假设类型文件路径

const API_PREFIX = '/categories';

/**
 * @description 获取完整的分类树 (用于前端树形选择器等)
 */
export function getCategoryTree() {
  return requestClient.get<StandardResponse<CategoryReadWithChildren[]>>(`${API_PREFIX}/tree`);
}

/**
 * @description [管理员] 获取分类列表 (动态分页、排序、过滤)
 */
export function getCategoryListPage(params: CategoryListParams) {
  return requestClient.get<StandardResponse<PageResponse<CategoryRead>>>(`${API_PREFIX}/`, {
    params,
  });
}

/**
 * @description [管理员] 获取单个分类详情
 */
export function getCategoryDetails(categoryId: string) {
  return requestClient.get<StandardResponse<CategoryRead>>(`${API_PREFIX}/${categoryId}`);
}

/**
 * @description [管理员] 创建新分类
 */
export function createCategory(data: CategoryCreateData) {
  return requestClient.post<StandardResponse<CategoryRead>>(`${API_PREFIX}/`, data);
}

/**
 * @description [管理员] 更新分类
 */
export function updateCategory(categoryId: string, data: CategoryUpdateData) {
  return requestClient.put<StandardResponse<CategoryRead>>(`${API_PREFIX}/${categoryId}`, data);
}

/**
 * @description [管理员] 删除分类
 */
export function deleteCategory(categoryId: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${categoryId}`);
}
