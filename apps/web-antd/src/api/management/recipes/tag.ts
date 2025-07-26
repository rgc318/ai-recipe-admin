// src/api/management/recipes/tag.ts
import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type { TagRead } from '#/views/management/recipe/types'; // 复用菜谱模块的类型

const API_PREFIX = '/tags';

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
