// src/views/management/recipe/types.ts

// --- 基础关联实体的只读类型 ---
// 这些通常由各自的模块提供，这里为方便演示而简化定义
export interface TagRead {
  id: string;
  name: string;
}

export interface CategoryRead {
  id: string;
  name: string;
}

export interface IngredientRead {
  id: string;
  name: string;
}

export interface UnitRead {
  id: string;
  name: string;
}

export interface UserReadBasic {
  id: string;
  username: string;
  avatar_url?: string | null;
}

// --- 菜谱配料的核心类型 ---

// 用于API响应的配料详情
export interface RecipeIngredientRead {
  id: string;
  quantity: number | null;
  note: string | null;
  ingredient: IngredientRead;
  unit: UnitRead | null;
}

// 用于创建/更新时提交给后端的配料数据结构
export interface RecipeIngredientInput {
  ingredient_id: string;
  unit_id: string | null;
  quantity: number | null;
  note: string | null;
}

// --- 菜谱的核心类型 ---

// 用于从API读取并展示的完整菜谱数据
export interface RecipeRead {
  id: string;
  title: string;
  description: string | null;
  steps: string;
  status: 'published' | 'draft' | 'archived'; // 假设后端有状态字段
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  author: UserReadBasic; // 假设后端会返回创建者信息
  category: CategoryRead | null;
  tags: TagRead[];
  ingredients: RecipeIngredientRead[];
  // 更多可能的字段
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: string | null;
}

// 创建新菜谱的请求体
export interface RecipeCreateData {
  title: string;
  description?: string | null;
  steps: string;
  category_id?: string | null;
  tag_ids?: string[];
  ingredients?: RecipeIngredientInput[];
  // 其他字段...
}

// 更新菜谱的请求体 (所有字段可选)
export interface RecipeUpdateData extends Partial<RecipeCreateData> {
  status?: 'published' | 'draft' | 'archived';
}

// 菜谱列表的查询参数
export interface RecipeListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  title?: string;
  status?: 'published' | 'draft' | 'archived';
  category_id?: string;
  tag_ids?: string[];
  author_id?: string;
}
