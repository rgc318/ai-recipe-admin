// src/api/management/content/ingredient.ts

import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';

// [核心] 从我们为 ingredient 模块创建的 types 文件中导入所有需要的类型
import type {
  IngredientRead,
  IngredientCreate,
  IngredientUpdate,
  IngredientMergePayload,
  BatchActionIngredientsPayload,
} from '#/views/content/ingredient/types'; // <-- 确保路径正确

const API_PREFIX = '/ingredients'; // 与后端 IngredientRouter 的 prefix 一致

// ========================================================
// == 管理与生命周期 API ==
// ========================================================

/**
 * @description 批量恢复软删除的食材
 * @param data - 包含 ingredient_ids 列表的请求体
 */
export function restoreIngredients(data: BatchActionIngredientsPayload) {
  return requestClient.post<StandardResponse<{ restored_count: number }>>(`${API_PREFIX}/restore`, data);
}

/**
 * @description 批量永久删除食材（高危操作）
 * @param data - 包含 ingredient_ids 列表的请求体
 */
export function permanentDeleteIngredients(data: BatchActionIngredientsPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/permanent-delete`, { data });
}

/**
 * @description 合并食材
 * @param data - 包含源食材和目标食材ID的请求体
 */
export function mergeIngredients(data: IngredientMergePayload) {
  return requestClient.post<StandardResponse<IngredientRead>>(`${API_PREFIX}/merge`, data);
}

// ========================================================
// == 标准 CRUD API ==
// ========================================================

/**
 * @description 分页、排序、过滤获取食材列表
 * @param params - 查询参数，包括分页、排序、过滤和 view_mode
 */
export function listIngredientsPaginated(params: any) {
  return requestClient.get<StandardResponse<PageResponse<IngredientRead>>>(`${API_PREFIX}/`, { params });
}

/**
 * @description 创建一个新食材
 * @param data - 创建食材所需的数据
 */
export function createIngredient(data: IngredientCreate) {
  return requestClient.post<StandardResponse<IngredientRead>>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新一个指定食材
 * @param id - 要更新的食材ID
 * @param data - 更新的数据
 */
export function updateIngredient(id: string, data: IngredientUpdate) {
  return requestClient.put<StandardResponse<IngredientRead>>(`${API_PREFIX}/${id}`, data);
}

/**
 * @description 软删除一个指定食材
 * @param id - 要删除的食材ID
 */
export function softDeleteSingleIngredient(id: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
}

/**
 * @description 批量软删除食材
 * @param data - 包含 ingredient_ids 列表的请求体
 */
export function batchSoftDeleteIngredients(data: BatchActionIngredientsPayload) {
  // 假设后端的批量软删除接口路径是 /bulk/soft
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/`, { data });
}

// ========================================================
// == 便捷查询 API (可选) ==
// ========================================================

/**
 * @description (便捷函数) 搜索食材用于选择器，本质上是调用 listIngredientsPaginated
 * @param params - 包含 search 查询的对象
 */
export function searchIngredients(params: { search: string }) {
  return listIngredientsPaginated(params);
}

/**
 * @description (便捷函数) 获取所有食材，用于筛选下拉框等场景
 */
export function getAllIngredients() {
  // 通过将 per_page 设置为一个非常大的数来获取所有数据
  return listIngredientsPaginated({ page: 1, per_page: 1000 });
}
