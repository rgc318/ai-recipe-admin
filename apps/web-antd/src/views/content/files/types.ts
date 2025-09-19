// /views/content/file/types.ts

// =================================================================
//                      核心数据模型 (Core Models)
// =================================================================

/** @description 从API读取的、已登记的文件记录。 */
export interface FileRecordRead {
  id: string;
  object_name: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  uploader_id: string;
  is_associated: boolean;
  created_at: string;
  profile_name: string;
  etag?: string | null;
  is_deleted: boolean;
  url?: string | null;
  uploader?: UploaderInfo | null;
}

/** @description 简化的上传者信息。 */
export interface UploaderInfo {
  id: string;
  nickname: string;
  avatar?: string | null;
}

/** @description 对象存储中物理文件的基本信息。 */
export interface FileInfo {
  object_name: string;
  size: number;
  last_modified: string;
}

// =================================================================
//                 API 请求载荷 (Request Payloads)
// =================================================================

// --- FileRecord (元数据) 管理相关 ---

/** @description 文件管理列表页的筛选查询参数。 */
export interface FileFilterParams {
  original_filename?: string;
  content_type?: string;
  profile_name?: string;
  uploader_id?: string;
  is_associated?: boolean;
}

/** @description 更新文件记录元数据。 */
export interface FileRecordUpdatePayload {
  original_filename?: string | null;
}

/** @description 批量恢复或永久删除。 */
export interface BulkActionPayload {
  record_ids: string[];
}

/** @description 合并文件记录。 */
export interface MergeRecordsPayload {
  source_id: string;
  target_id: string;
}

// --- File (物理文件) 管理相关 ---

/** @description 请求“预签名PUT URL”。 */
export interface PresignedPutUrlPayload {
  profile_name: string;
  original_filename: string;
  path_params?: Record<string, any>;
  expires_in?: number;
}

/** @description 请求“预签名POST策略”。 */
export interface PresignedPolicyPayload {
  profile_name: string;
  original_filename: string;
  content_type: string;
  path_params?: Record<string, any>;
  expires_in?: number;
}

/** @description 客户端上传成功后登记文件。 */
export interface RegisterFilePayload {
  object_name: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  profile_name: string;
  etag?: string | null;
}

/** @description 移动物理文件并更新记录。 */
export interface MoveFilePayload {
  profile_name: string;
  record_id: string;
  destination_key: string;
}

/** @description 批量删除物理文件。 */
export interface DeleteFilesPayload {
  profile_name: string;
  object_names: string[];
}


// =================================================================
//                  API 响应类型 (Response Types)
// =================================================================

/** @description “预签名PUT URL”的响应。 */
export interface PresignedUploadURL {
  upload_url: string;
  object_name: string;
  url: string;
}

/** @description “预签名POST策略”的响应。 */
export interface PresignedUploadPolicy {
  url: string;
  fields: Record<string, string>;
  object_name: string;
  final_url: string;
}

/** @description 服务器直传成功后的响应。 */
export interface UploadResult {
  record_id: string;
  object_name: string;
  url: string;
  etag?: string | null;
  file_size: number;
  content_type: string;
}

/** @description 存储统计的响应。 */
export interface StorageUsageStats {
  group_key?: string | null;
  total_files: number;
  total_size_bytes: number;
}
