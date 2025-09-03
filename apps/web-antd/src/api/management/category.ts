import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type {
  CategoryRead,
  CategoryCreate,
  CategoryUpdate,
  CategoryReadWithChildren,
} from '#/views/management/category/types';

const API_PREFIX = '/categories';

// 获取分页列表 (给后台管理表格用)
export function listCategoriesPaginated(params: any) {
  return requestClient.get<StandardResponse<PageResponse<CategoryRead>>>(`${API_PREFIX}/`, { params });
}

// 获取分类树 (给“选择父分类”的下拉框用)
export function getCategoryTree() {
  return requestClient.get<StandardResponse<CategoryReadWithChildren[]>>(`${API_PREFIX}/tree`);
}

// 创建新分类
export function createCategory(data: CategoryCreate) {
  return requestClient.post<StandardResponse<CategoryRead>>(`${API_PREFIX}/`, data);
}

// 更新分类
export function updateCategory(id: string, data: CategoryUpdate) {
  return requestClient.put<StandardResponse<CategoryRead>>(`${API_PREFIX}/${id}`, data);
}

// 删除分类
export function deleteCategory(id: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
}
