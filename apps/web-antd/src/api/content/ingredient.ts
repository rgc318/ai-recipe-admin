// src/api/management/content/ingredient.ts
import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type { IngredientRead } from '#/views/content/recipe/types';

const API_PREFIX = '/ingredients';

/**
 * @description 搜索食材用于选择器
 * @param params - 包含 name 的查询对象
 */
export function searchIngredients(params: { name: string }) {
  return requestClient.get<StandardResponse<PageResponse<IngredientRead>>>(`${API_PREFIX}/`, { params });
}
