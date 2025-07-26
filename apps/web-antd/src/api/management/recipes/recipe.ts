// src/api/management/recipes/recipe.ts
import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type {
  RecipeListParams,
  RecipeRead,
  RecipeCreateData,
  RecipeUpdateData,
} from '#/views/management/recipe/types';

const API_PREFIX = '/recipes';

/**
 * @description 获取菜谱列表 (动态分页、排序、过滤)
 */
export function getRecipeListPage(params: RecipeListParams) {
  return requestClient.get<StandardResponse<PageResponse<RecipeRead>>>(
    `${API_PREFIX}/`,
    { params },
  );
}

/**
 * @description 获取单个菜谱详情
 */
export function getRecipeDetails(recipeId: string) {
  return requestClient.get<StandardResponse<RecipeRead>>(`${API_PREFIX}/${recipeId}`);
}

/**
 * @description 创建新菜谱
 */
export function createRecipe(data: RecipeCreateData) {
  return requestClient.post<StandardResponse<RecipeRead>>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新菜谱
 */
export function updateRecipe(recipeId: string, data: RecipeUpdateData) {
  return requestClient.put<StandardResponse<RecipeRead>>(`${API_PREFIX}/${recipeId}`, data);
}

/**
 * @description (软)删除菜谱
 */
export function deleteRecipe(recipeId: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${recipeId}`);
}

/**
 * @description 批量(软)删除菜谱
 */
export function batchDeleteRecipes(data: { recipe_ids: string[] }) {
  // 注意：axios 的 delete 方法，第二个参数是 config 对象，请求体要放在 data 属性里
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/batch`, {
    data,
  });
}
