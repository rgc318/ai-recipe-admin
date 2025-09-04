import { ref } from 'vue';
import { message } from 'ant-design-vue';
import axios, { isAxiosError } from 'axios'; // 1. 【优化】导入 isAxiosError
import { getPresignedUploadUrl, registerFile } from '#/api/management/files/file'; // 确保API路径正确
import type { FileRecordRead } from '#/views/management/files/types'; // 2. 【优化】明确导入类型

// 3. 【优化】为 antd 的 customRequest 参数定义精确的类型
interface UploadRequestOptions {
  file: File;
  onSuccess: (body: FileRecordRead) => void;
  onError: (err: Error) => void;
  onProgress: (event: { percent: number }) => void;
}

// 定义 Hook 的输入参数
interface UploaderOptions {
  profile_name: string;
  path_params?: Record<string, any>;
}

export function useUploader(options: UploaderOptions) {
  const isUploading = ref(false);

  const customRequest = async ({ file, onSuccess, onError, onProgress }: UploadRequestOptions) => {
    isUploading.value = true;
    try {
      const presignedResponse = await getPresignedUploadUrl({
        profile_name: options.profile_name,
        original_filename: file.name,
        path_params: options.path_params || {},
      });
      const { upload_url, object_name } = presignedResponse;

      const response = await axios.put(upload_url, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress({ percent });
          }
        },
      });

      const etag = response.headers.etag?.replace(/"/g, '');

      const fileRecord = await registerFile({
        object_name: object_name,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        profile_name: options.profile_name,
        etag: etag,
      });

      onSuccess(fileRecord);

    } catch (error: any) {
      console.error('上传流程失败:', error);

      // 4. 【优化】尝试从 axios 错误中提取更具体的后端信息
      let errorMessage = '上传失败，请重试';
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = `上传失败: ${error.response.data.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
      onError(error);
    } finally {
      isUploading.value = false;
    }
  };

  return {
    isUploading,
    customRequest,
  };
}
