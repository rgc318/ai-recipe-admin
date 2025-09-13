import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type {
  UnitRead,
  UnitCreateData,
  UnitUpdateData,
  UnitMergeData,
  BatchDeleteUnitsPayload,
} from '#/views/content/units/types'; // 确认路径正确

const API_PREFIX = '/units';

/**
 * @description 获取所有单位，不分页（用于下拉选择）
 */
export function getAllUnits() {
  return requestClient.get<StandardResponse<UnitRead[]>>(`${API_PREFIX}/all`);
}

/**
 * @description 分页、排序、过滤获取单位列表
 */
export function listUnitsPaginated(params: any) {
  return requestClient.get<StandardResponse<PageResponse<UnitRead>>>(`${API_PREFIX}/`, { params });
}

/**
 * @description 创建一个新单位
 */
export function createUnit(data: UnitCreateData) {
  return requestClient.post<StandardResponse<UnitRead>>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新一个指定单位
 */
export function updateUnit(id: string, data: UnitUpdateData) {
  return requestClient.put<StandardResponse<UnitRead>>(`${API_PREFIX}/${id}`, data);
}

/**
 * @description 软删除一个指定单位
 */
export function deleteUnit(id: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
}

/**
 * @description 批量软删除单位
 */
export function batchDeleteUnits(data: BatchDeleteUnitsPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/batch`, { data });
}

/**
 * @description 批量恢复软删除的单位
 */
export function restoreUnits(data: BatchDeleteUnitsPayload) {
  return requestClient.post<StandardResponse<{ restored_count: number }>>(`${API_PREFIX}/restore`, data);
}

/**
 * @description 批量永久删除单位
 */
export function permanentDeleteUnits(data: BatchDeleteUnitsPayload) {
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/permanent-delete`, { data });
}

/**
 * @description 合并单位
 */
export function mergeUnits(data: UnitMergeData) {
  return requestClient.post<StandardResponse<{ merged_count: number }>>(`${API_PREFIX}/merge`, data);
}
