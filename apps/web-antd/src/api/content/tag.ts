// src/api/management/content/tag.ts
import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type {
  TagRead,
  TagCreateData,
  TagUpdateData,
  TagMergeData,
  BatchDeleteTagsPayload,
} from '#/views/content/tag/types'; // ✅ 确保从 tag 自己的类型文件导入

const API_PREFIX = '/tags';


/**
 * @description 批量恢复软删除的标签
 * @param data - 包含 tag_ids 列表的请求体
 */
export function restoreTags(data: BatchDeleteTagsPayload) {
  return requestClient.post<StandardResponse<{ restored_count: number }>>(`${API_PREFIX}/restore`, data);
}

/**
 * @description 批量永久删除标签（高危操作）
 * @param data - 包含 tag_ids 列表的请求体
 */
export function permanentDeleteTags(data: BatchDeleteTagsPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/permanent-delete`, { data });
}

/**
 * @description 搜索标签用于选择器
 * @param params - 包含 name 的查询对象
 */
export function searchTags(params: { name: string }) {
  // 假设后端支持按名称模糊搜索标签
  return requestClient.get<StandardResponse<PageResponse<TagRead>>>(`${API_PREFIX}/`, { params });
}

// 如果需要获取所有标签用于筛选，可以再加一个函数
export function getAllTags() {
  // 假设 per_page 足够大能获取所有
  return requestClient.get<StandardResponse<PageResponse<TagRead>>>(`${API_PREFIX}/?per_page=1000`);
}


/**
 * @description 分页、排序、过滤获取标签列表
 * @param params - 查询参数，包括分页、排序和过滤
 */
export function listTagsPaginated(params: any) {
  return requestClient.get<StandardResponse<PageResponse<TagRead>>>(`${API_PREFIX}/`, { params });
}

/**
 * @description 创建一个新标签
 * @param data - 创建标签所需的数据
 */
export function createTag(data: TagCreateData) {
  return requestClient.post<StandardResponse<TagRead>>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新一个指定标签
 * @param id - 要更新的标签ID
 * @param data - 更新的数据
 */
export function updateTag(id: string, data: TagUpdateData) {
  return requestClient.put<StandardResponse<TagRead>>(`${API_PREFIX}/${id}`, data);
}

/**
 * @description 删除一个指定标签
 * @param id - 要删除的标签ID
 */
export function deleteTag(id: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
}

/**
 * @description 批量删除标签
 * @param data - 包含 tag_ids 列表的请求体
 */
export function batchDeleteTags(data: BatchDeleteTagsPayload) {
  // 注意：DELETE 请求通常通过 params 传参，但 RESTful 风格也允许用 body，取决于你的后端实现
  // Vben 框架的 requestClient delete 方法可能需要调整以支持 body
  // 这里我们假设后端 @router.delete("/batch") 能正确接收 body
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/batch`, { data });
}

/**
 * @description 合并标签
 * @param data - 包含源标签和目标标签ID的请求体
 */
export function mergeTags(data: TagMergeData) {
  return requestClient.post<StandardResponse<{ merged_count: number }>>(`${API_PREFIX}/merge`, data);
}
