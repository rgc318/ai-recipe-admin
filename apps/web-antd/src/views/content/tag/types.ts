// 定义从API读取的标签数据结构
export interface TagRead {
  id: string;
  name: string;
  recipe_count: number;
  created_at: string;
}

// 定义创建标签时发送给API的数据结构
export interface TagCreateData {
  name: string;
}

// 定义更新标签时发送给API的数据结构
export type TagUpdateData = Partial<TagCreateData>;

// 定义合并标签时发送给API的数据结构
export interface TagMergeData {
  source_tag_ids: string[];
  target_tag_id: string;
}

// ▼▼▼ 【核心新增】定义批量删除标签时发送给API的数据结构 ▼▼▼
export interface BatchDeleteTagsPayload {
  tag_ids: string[];
}
