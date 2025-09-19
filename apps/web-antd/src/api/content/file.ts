// 建议的新文件位置: src/api/content/file.ts

import { requestClient } from '#/api/request';
import type { StandardResponse } from '#/api/types';
import type {
  UploadResult,
  PresignedUploadURL,
  PresignedUploadPolicy,
  RegisterFilePayload,
  PresignedPutUrlPayload,
  PresignedPolicyPayload,
  DeleteFilesPayload,
  MoveFilePayload,
  FileInfo, FileRecordRead,
} from '#/views/content/files/types';
import axios from "axios"; // [修正] 从我们完善后的 types 文件导入

// [修正] 使用与后端 Router 一致的前缀
const API_PREFIX = '/file';

/**
 * @description 按业务场景 Profile 直传文件到服务器
 * @param formData - 包含 profile_name, path_params_json, file 的 FormData
 */
export function uploadByProfile(formData: FormData) {
  // 注意：service 层会调用 register_uploaded_file，所以这个函数同时处理上传和登记
  return requestClient.post<StandardResponse<UploadResult>>(`${API_PREFIX}/upload/by_profile`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * @description 【安全推荐】生成用于客户端直传的预签名POST策略
 * @param payload - 请求参数
 */
export function generatePresignedUploadPolicy(payload: PresignedPolicyPayload) {
  return requestClient.post<StandardResponse<PresignedUploadPolicy>>(`${API_PREFIX}/presigned-url/policy`, payload);
}

/**
 * @description 在客户端直传成功后，调用此接口登记文件
 * @param payload - 登记文件所需的数据
 */
export function registerFile(payload: RegisterFilePayload) {
  // 这个 service 方法返回 ORM 对象，我们在前端自己转换为 DTO
  return requestClient.post<StandardResponse<any>>(`${API_PREFIX}/register`, payload);
}

/**
 * @description 移动物理文件并同步更新数据库记录
 * @param payload - 包含 record_id, destination_key, profile_name
 */
export function moveFile(payload: MoveFilePayload) {
  return requestClient.post<StandardResponse<FileRecordRead>>(`${API_PREFIX}/move`, payload);
}

/**
 * @description 从对象存储中批量删除物理文件（不操作DB）
 * @param payload - 包含 profile_name 和 object_names 列表
 */
export function deletePhysicalFiles(payload: DeleteFilesPayload) {
  // 注意：requestClient 的 delete 方法需要能发送 body
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/`, { data: payload });
}

/**
 * @description 检查物理文件是否存在
 * @param profileName
 * @param objectName
 */
export function checkFileExists(profileName: string, objectName: string) {
  return requestClient.get<StandardResponse<boolean>>(`${API_PREFIX}/exists`, {
    params: { profile_name: profileName, object_name: objectName },
  });
}

/**
 * @description 【增强版】列出物理文件的详细信息
 * @param profileName
 * @param prefix
 */
export function listFileDetails(profileName: string, prefix: string) {
  return requestClient.get<StandardResponse<FileInfo[]>>(`${API_PREFIX}/`, {
    params: { profile_name: profileName, prefix: prefix },
  });
}

/**
 * @description 生成用于下载的预签名URL
 * @param profileName
 * @param objectName
 */
export function generatePresignedGetUrl(profileName: string, objectName: string) {
  return requestClient.get<StandardResponse<string>>(`${API_PREFIX}/presigned-url/get`, {
    params: { profile_name: profileName, object_name: objectName },
  });
}



/**
 * @description 【【核心通用工具】】一个底层的、只负责将文件上传到云存储的函数。
 * @param policy - 从后端获取的预签名POST策略。
 * @param file - 要上传的 File 对象。
 * @param onProgress - 一个可选的回调函数，用于报告上传进度 (0-100)。
 * @returns {Promise<string>} 返回成功上传后的 ETag。
 */
export async function uploadToCloud(
  policy: PresignedUploadPolicy,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  Object.entries(policy.fields).forEach(([key, value]) => {
    formData.append(key, value as string);
  });
  formData.append('file', file);

  try {
    const response = await axios.post(policy.url, formData, {
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress?.(percent);
        }
      },
    });

    if (response.status === 204 || response.status === 201) {
      const etag = response.headers['etag']?.replace(/"/g, '');
      if (!etag) {
        throw new Error('Upload succeeded, but ETag was not found in response headers.');
      }
      return etag;
    } else {
      throw new Error(`Cloud storage upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error during physical upload to cloud:', error);
    // 重新抛出错误，让调用方知道上传失败
    throw error;
  }
}
