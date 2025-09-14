// 定义从API分页列表读取的分类数据结构
export interface CategoryRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  parent: { id: string; name: string } | null;
  is_deleted: boolean;
  recipe_count: number;
  created_at: string;
}

// 定义创建分类时发送给API的数据结构
export interface CategoryCreate {
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
}

// 定义更新分类时发送给API的数据结构
export type CategoryUpdate = Partial<CategoryCreate>;

// 定义分类树节点的数据结构
export interface CategoryReadWithChildren extends CategoryRead {
  children: CategoryReadWithChildren[];
}

// 定义合并分类时发送给API的数据结构
export interface CategoryMergeData {
  source_category_ids: string[];
  target_category_id: string;
}

// 定义批量操作分类时发送给API的数据结构
export interface BatchDeleteCategoriesPayload {
  category_ids: string[];
}
