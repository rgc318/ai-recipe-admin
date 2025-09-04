import { requestClient } from '#/api/request';
import type { PageResponse } from '#/api/types';
import type {
  FileRecordRead,
  FileRecordUpdate,
  FileFilterParams, // 1. 【推荐】导入筛选类型，让参数更安全
  PresignedUrlPayload,
  PresignedUploadURL,
  RegisterFilePayload,
} from '#/views/management/files/types'; // 确保类型路径正确

const API_PREFIX = '/file';
const MANAGEMENT_PREFIX = '/file-management';

// ========================================================
// == 面向用户的“动作”类接口 (User-Facing Actions) ==
// ========================================================

export function getPresignedUploadUrl(payload: PresignedUrlPayload) {
  return requestClient.post<PresignedUploadURL>(`${API_PREFIX}/presigned-url/put`, payload);
}

export function registerFile(payload: RegisterFilePayload) {
  return requestClient.post<FileRecordRead>(`${API_PREFIX}/register`, payload);
}

export function uploadFileByProfile(formData: FormData) {
  return requestClient.post<FileRecordRead>(`${API_PREFIX}/upload/by_profile`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ▼▼▼ 【核心新增】补全后端已提供的接口 ▼▼▼

/**
 * @description 根据 Profile 和文件对象名称列表，从存储中删除一个或多个物理文件。
 * @param profileName - 文件所在存储的 Profile 名称。
 * @param objectNames - 需要删除的文件对象名称（key）列表。
 */
export function deletePhysicalFiles(profileName: string, objectNames: string[]) {
  return requestClient.delete<null>(`${API_PREFIX}/files`, {
    data: { profile_name: profileName, object_names: objectNames },
  });
}

/**
 * @description 为一个私有对象生成临时的、安全的文件下载 URL。
 * @param profileName - 文件所在存储的 Profile 名称。
 * @param objectName - 文件的对象名称（key）。
 */
export function getPresignedDownloadUrl(profileName: string, objectName: string) {
  return requestClient.get<string>(`${API_PREFIX}/presigned-url/get`, {
    params: { profile_name: profileName, object_name: objectName },
  });
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ========================================================
// == 面向管理员的“管理”类接口 (Admin Management) ==
// ========================================================

/**
 * @description 分页获取文件记录列表。用于后台“媒体库”或“文件管理”表格。
 * @param params - 包含分页、排序、筛选等参数
 */
export function listFileRecordsPaginated(params: Partial<FileFilterParams & { page: number; per_page: number; sort: string }>) {
  // 2. 【推荐】为 params 添加更精确的类型
  return requestClient.get<PageResponse<FileRecordRead>>(`${MANAGEMENT_PREFIX}/`, { params });
}

// ▼▼▼ 【核心新增】补全后端已提供的接口 ▼▼▼

/**
 * @description 根据文件记录的数据库ID，获取其完整的元数据信息。
 * @param recordId - 文件记录的ID。
 */
export function getFileRecordDetails(recordId: string) {
  return requestClient.get<FileRecordRead>(`${MANAGEMENT_PREFIX}/${recordId}`);
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

export function updateFileRecordMetadata(id: string, data: FileRecordUpdate) {
  return requestClient.put<FileRecordRead>(`${MANAGEMENT_PREFIX}/${id}`, data);
}

export function deleteFileRecord(id: string) {
  return requestClient.delete<null>(`${MANAGEMENT_PREFIX}/${id}`);
}
