// 这个接口的字段应该与后端 Pydantic 的 CategoryRead schema 完全匹配
export interface CategoryRead {
  id: string; // UUID 在前端是字符串
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  // 为了在表格中方便地显示父分类名称，可以让后端在返回列表时把 parent 对象也一并返回
  parent?: {
    id: string;
    name: string;
  } | null;
}

// 与后端 Pydantic 的 CategoryCreate schema 匹配
export interface CategoryCreate {
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
}

// 与后端 Pydantic 的 CategoryUpdate schema 匹配
export interface CategoryUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  parent_id?: string | null;
}

// 与后端 Pydantic 的 CategoryReadWithChildren schema 匹配 (用于树形选择器)
export interface CategoryReadWithChildren extends CategoryRead {
  children: CategoryReadWithChildren[];
}
