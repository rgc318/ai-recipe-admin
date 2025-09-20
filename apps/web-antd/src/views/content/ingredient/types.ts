// 文件位置: src/views/content/ingredient/types.ts

// =================================================================
//                      核心数据模型 (Core Models)
// =================================================================

/**
 * @description 从API读取的、完整的食材数据模型。
 * 对应后端的 IngredientRead Schema。
 */
export interface IngredientRead {
  id: string;
  name: string;
  description?: string | null;
  plural_name?: string | null;
  normalized_name: string;
  recipe_count: number;
  created_at?: string | null;
  is_deleted: boolean;
}

// =================================================================
//                 API 请求载荷 (Request Payloads)
// =================================================================

/**
 * @description 创建新食材时，发送给API的数据模型。
 */
export interface IngredientCreateData {
  name: string;
  description?: string | null;
  plural_name?: string | null;
}

/**
 * @description 更新食材时，发送给API的数据模型。
 */
export type IngredientUpdateData = Partial<IngredientCreateData>;


/**
 * @description 食材列表页，用于构建筛选查询的参数模型。
 */
export interface IngredientFilterParams {
  search?: string;
  view_mode?: 'active' | 'all' | 'deleted';
}

/**
 * @description 合并食材时，发送给API的数据模型。
 */
export interface IngredientMergePayload {
  source_ingredient_ids: string[];
  target_ingredient_id: string;
}

/**
 * @description 批量操作（如恢复、删除）食材时，发送给API的数据模型。
 */
export interface BatchActionIngredientsPayload {
  ingredient_ids: string[];
}
