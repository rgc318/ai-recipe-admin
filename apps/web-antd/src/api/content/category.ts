import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type {
  CategoryRead,
  CategoryCreate,
  CategoryUpdate,
  CategoryReadWithChildren,
  CategoryMergeData,
  BatchDeleteCategoriesPayload,
} from '#/views/content/category/types'; // 确认路径正确

const API_PREFIX = '/categories';

/**
 * @description 获取分页列表 (后台管理表格用)
 */
export function listCategoriesPaginated(params: any) {
  return requestClient.get<StandardResponse<PageResponse<CategoryRead>>>(`${API_PREFIX}/`, { params });
}

/**
 * @description 获取完整的分类树 (给“选择父分类”的下拉框等组件用)
 */
export function getCategoryTree() {
  return requestClient.get<StandardResponse<CategoryReadWithChildren[]>>(`${API_PREFIX}/tree`);
}

/**
 * @description 创建新分类
 */
export function createCategory(data: CategoryCreate) {
  return requestClient.post<StandardResponse<CategoryRead>>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新分类
 */
export function updateCategory(id: string, data: CategoryUpdate) {
  return requestClient.put<StandardResponse<CategoryRead>>(`${API_PREFIX}/${id}`, data);
}

/**
 * @description 软删除一个指定分类
 */
export function deleteCategory(id: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
}

/**
 * @description 批量软删除分类
 */
export function batchDeleteCategories(data: BatchDeleteCategoriesPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/batch`, { data });
}

/**
 * @description 批量恢复软删除的分类
 */
export function restoreCategories(data: BatchDeleteCategoriesPayload) {
  return requestClient.post<StandardResponse<{ restored_count: number }>>(`${API_PREFIX}/restore`, data);
}

/**
 * @description 批量永久删除分类
 */
export function permanentDeleteCategories(data: BatchDeleteCategoriesPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/permanent-delete`, { data });
}

/**
 * @description 合并分类
 */
export function mergeCategories(data: CategoryMergeData) {
  return requestClient.post<StandardResponse<{ merged_count: number }>>(`${API_PREFIX}/merge`, data);
}
