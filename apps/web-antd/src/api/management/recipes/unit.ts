// src/api/management/unit.ts
import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type { UnitRead } from '#/views/management/recipe/types'; // 单位类型可以复用

// 假设后端的单位接口前缀是 /units
const API_PREFIX = '/units';

/**
 * @description 搜索单位用于选择器
 * @param params - 包含 name 的查询对象
 */
export function searchUnits(params: { name: string }) {
  // 假设后端支持按名称模糊搜索单位
  return requestClient.get<StandardResponse<PageResponse<UnitRead>>>(`${API_PREFIX}/`, { params });
}
