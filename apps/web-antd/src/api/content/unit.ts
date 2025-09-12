import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';
import type { UnitRead, UnitCreate, UnitUpdate } from '#/views/content/units/types';

const API_PREFIX = '/units';

/**
 * @description 获取所有单位，不分页。用于菜谱编辑器的下拉选择框。
 */
export function getAllUnits() {
  // 假设拦截器会处理外层的 StandardResponse，直接返回 UnitRead[]
  return requestClient.get<UnitRead[]>(`${API_PREFIX}/all`);
}

/**
 * @description 分页获取单位列表。用于后台管理表格。
 * @param params - 包含分页、排序、筛选等参数
 */
export function listUnitsPaginated(params: any) {
  // 假设拦截器会处理外层的 StandardResponse，直接返回 PageResponse<UnitRead>
  return requestClient.get<PageResponse<UnitRead>>(`${API_PREFIX}/`, { params });
}

/**
 * @description 创建一个新单位。
 * @param data - 创建单位所需的数据
 */
export function createUnit(data: UnitCreate) {
  return requestClient.post<UnitRead>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新一个指定ID的单位。
 * @param id - 要更新的单位ID
 * @param data - 更新的数据
 */
export function updateUnit(id: string, data: UnitUpdate) {
  return requestClient.put<UnitRead>(`${API_PREFIX}/${id}`, data);
}

/**
 * @description 删除一个指定ID的单位。
 * @param id - 要删除的单位ID
 */
export function deleteUnit(id: string) {
  return requestClient.delete<null>(`${API_PREFIX}/${id}`);
}
