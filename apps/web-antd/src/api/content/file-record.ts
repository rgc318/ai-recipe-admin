// 建议的新文件位置: src/api/content/file-record.ts

import { requestClient } from '#/api/request';
import type { PageResponse, StandardResponse } from '#/api/types';
import type {
  FileRecordRead,
  FileRecordUpdatePayload,
  FileFilterParams,
  BulkActionPayload,
  MergeRecordsPayload,
  StorageUsageStats,
} from '#/views/content/files/types'; // [修正] 从我们完善后的 types 文件导入

// [修正] 使用与后端 Router 一致的前缀
const API_PREFIX = '/file_management';

/**
 * @description 【管理员】分页、排序、过滤获取文件记录列表
 * @param params - 查询参数，包含分页、排序、过滤和 view_mode
 */
export function listFileRecords(params: Partial<FileFilterParams & { page: number; per_page: number; sort: string; view_mode: string }>) {
  return requestClient.get<StandardResponse<PageResponse<FileRecordRead>>>(`${API_PREFIX}/`, { params });
}

/**
 * @description 获取单个文件记录详情
 * @param recordId - 文件记录的ID
 */
export function getFileRecord(recordId: string) {
  return requestClient.get<StandardResponse<FileRecordRead>>(`${API_PREFIX}/${recordId}`);
}

/**
 * @description 更新文件记录元数据
 * @param recordId - 要更新的记录ID
 * @param data - 更新的数据
 */
export function updateFileRecord(recordId: string, data: FileRecordUpdatePayload) {
  return requestClient.put<StandardResponse<FileRecordRead>>(`${API_PREFIX}/${recordId}`, data);
}

/**
 * @description 软删除一个文件记录 (移入回收站)
 * @param recordId - 要软删除的记录ID
 */
export function softDeleteFileRecord(recordId: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${recordId}`);
}

// ========================================================
// == [新增] 补全所有管理和生命周期API ==
// ========================================================

/**
 * @description 【管理员】批量恢复软删除的记录
 * @param payload - 包含 record_ids 列表的请求体
 */
export function restoreFileRecords(payload: BulkActionPayload) {
  // 注意：后端批量恢复接口路径是 /restore/bulk，并且接收 record_ids
  return requestClient.post<StandardResponse<{ restored_count: number }>>(`${API_PREFIX}/restore/bulk`, payload);
}

/**
 * @description 【管理员】彻底删除一个文件记录和其物理文件（高危）
 * @param recordId - 要彻底删除的记录ID
 */
export function permanentDeleteFileRecord(recordId: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${recordId}/permanent`);
}

/**
 * @description 【管理员】合并两条重复的文件记录
 * @param payload - 包含源记录和目标记录ID的请求体
 */
export function mergeFileRecords(payload: MergeRecordsPayload) {
  return requestClient.post<StandardResponse<FileRecordRead>>(`${API_PREFIX}/merge`, payload);
}

/**
 * @description 【管理员】获取文件存储统计
 * @param params - 可选的分组参数 { group_by: '...' }
 */
export function getStorageStats(params?: { group_by: string }) {
  return requestClient.get<StandardResponse<StorageUsageStats[] | StorageUsageStats>>(`${API_PREFIX}/stats`, { params });
}


/**
 * @description 【管理员】批量软删除文件记录 (移入回收站)
 * @param payload - 包含 record_ids 列表的请求体
 */
export function batchSoftDeleteFileRecords(payload: BulkActionPayload) {
  // 假设后端提供了一个 DELETE /file-records/bulk/soft 接口
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/bulk/soft`, { data: payload });
}

/**
 * @description 【管理员】批量彻底删除文件记录和其物理文件（高危）
 * @param payload - 包含 record_ids 列表的请求体
 */
export function batchPermanentDeleteFileRecords(payload: BulkActionPayload) {
  // 假设后端提供了一个 DELETE /file-records/bulk/permanent 接口
  return requestClient.delete<StandardResponse<{ deleted_count: number }>>(`${API_PREFIX}/bulk/permanent`, { data: payload });
}
