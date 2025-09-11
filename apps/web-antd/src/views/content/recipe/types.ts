// src/views/management/recipe/types.ts

// --- 基础实体 ---

import type {FileRecordRead} from "#/views/content/files/types";

export interface TagRead {
  id: string;
  name: string;
}

export interface CategoryRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
}

export interface CategoryReadWithChildren extends CategoryRead {
  children: CategoryReadWithChildren[];
}

export interface IngredientRead {
  id: string;
  name: string;
}

export interface UnitRead {
  id: string;
  name: string;
}

// --- 菜谱步骤 ---
// 用于 API 响应
export interface RecipeStepRead {
  id: string;
  step_number: number;
  instruction: string;
  duration: string | null; // 【新增】步骤时长
  images: FileRecordRead[];
}

// 用于创建/更新时提交
export interface RecipeStepInput {
  instruction: string;
  duration?: string | null; // 【新增】步骤时长
  image_ids?: string[];
}

// --- 菜谱配料 ---
// 用于 API 响应
export interface RecipeIngredientRead {
  id: string;
  group: string | null; // 【新增】配料分组
  quantity: number | null;
  note: string | null;
  ingredient: IngredientRead;
  unit: UnitRead | null;
}

// 用于创建/更新时提交
export interface RecipeIngredientInput {
  ingredientName: string | null; // 用户在输入框看到和输入的
  ingredientId: string | null;   // 用户选中后，我们记录的ID
  unit_id: string | null;
  group?: string | null; // 【新增】配料分组
  quantity: number | null;
  note: string | null;
}

// --- 核心菜谱模型 ---
// 用于 API 响应 (对应 RecipeRead Pydantic Schema)
export interface RecipeRead {
  id: string;
  title: string;
  description: string | null;
  prep_time: string | null;
  cook_time: string | null;
  servings: string | null;
  created_at: string;
  updated_at: string;

  // 【新增】附加信息
  difficulty: string | null;
  equipment: string | null;
  author_notes: string | null;

  cover_image: FileRecordRead | null;
  gallery_images: FileRecordRead[];
  steps: RecipeStepRead[]; // 内部已更新
  ingredients: RecipeIngredientRead[]; // 内部已更新
  tags: TagRead[];
  categories: CategoryRead[];
}

// 用于创建菜谱 (对应 RecipeCreate Pydantic Schema)
export interface RecipeCreateData {
  title: string;
  description?: string | null;
  prep_time?: string | null;
  cook_time?: string | null;
  servings?: string | null;

  // 【新增】附加信息
  difficulty?: string | null;
  equipment?: string | null;
  author_notes?: string | null;

  cover_image_id?: string | null;
  gallery_image_ids?: string[];
  steps?: RecipeStepInput[]; // 内部已更新
  ingredients?: RecipeIngredientInput[]; // 内部已更新
  category_ids?: string[];
  tags?: (string | { id: string; name: string })[];
  cover_image?: null ;
  gallery_images?: null;
  gallery_images_to_add?: null;
  gallery_images_to_delete?: null;
}

// 用于更新菜谱 (对应 RecipeUpdate Pydantic Schema)
// 因为 RecipeUpdate 是 Partial<RecipeCreateData>，所以它会自动获得所有新的可选字段
export type RecipeUpdateData = Partial<RecipeCreateData>;

// 列表查询参数 (保持不变或根据后端微调)
export interface RecipeListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  title?: string;
  category_ids?: string[];
  tag_ids?: string[];
}
