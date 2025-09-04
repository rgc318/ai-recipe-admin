/**
 * @description 用于从API读取的、已登记的文件记录的数据模型。
 * 字段应与后端 Pydantic 的 FileRecordRead schema 完全匹配。
 */
export interface FileRecordRead {
  id: string; // 数据库记录的UUID
  object_name: string; // 文件在云存储中的唯一路径/键
  original_filename: string;
  file_size: number;
  content_type: string;
  uploader_id: string; // 上传者的UUID
  created_at: string; // ISO 格式的日期字符串
  profile_name: string;
  etag?: string | null;
  url?: string | null; // 动态生成的可访问URL
}

/**
 * @description 请求“预签名上传URL”时，发送给后端的数据模型。
 */
export interface PresignedUrlPayload {
  profile_name: string;
  original_filename: string;
  path_params?: Record<string, any>;
}

/**
 * @description 后端返回的“预签名上传URL”对象的数据模型。
 */
export interface PresignedUploadURL {
  upload_url: string; // 供前端直接上传文件到云存储的URL
  object_name: string; // 文件上传后在云存储中的唯一路径/键
  url: string; // 文件上传成功后的最终可访问URL
}

/**
 * @description 在文件成功上传到云后，“登记”文件时发送给后端的数据模型。
 */
export interface RegisterFilePayload {
  object_name: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  profile_name: string;
  etag?: string | null;
}


// ▼▼▼ 【核心新增】为“后台管理”场景补充的类型 ▼▼▼

/**
 * @description 更新文件记录元数据时，发送给API的数据模型。
 * 所有字段都是可选的。
 */
export interface FileRecordUpdate {
  original_filename?: string | null;
}

/**
 * @description 文件管理列表页，用于构建筛选查询的参数模型。
 */
export interface FileFilterParams {
  original_filename?: string;
  content_type?: string;
  profile_name?: string;
  uploader_id?: string;
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
