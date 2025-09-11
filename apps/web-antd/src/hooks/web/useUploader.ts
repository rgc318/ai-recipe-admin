// 文件: src/hooks/web/useUploader.ts
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { generatePresignedUploadPolicy, registerFile } from '#/api/management/files/file';
import type { FileRecordRead } from '#/views/content/files/types';

interface UploaderOptions {
  profileName: string;
}

export function useUploader(options: UploaderOptions) {
  const isUploading = ref(false);

  // 这是我们通用的“预上传”+“临时-正式”模式的核心实现
  const customRequest = async ({ file, onSuccess, onError, onProgress }: any) => {
    isUploading.value = true;
    try {
      // 1. 获取上传策略 (总是指向 tmp/ 目录)
      const policy = await generatePresignedUploadPolicy({
        original_filename: file.name,
        content_type: file.type,
        profile_name: options.profileName,
      });

      // 2. 物理上传文件到云
      const formData = new FormData();
      Object.keys(policy.fields).forEach((key) => formData.append(key, policy.fields[key]));
      formData.append('file', file);
      await axios.post(policy.url, formData, {
        onUploadProgress: (event) => {
          if (event.total) onProgress({ percent: Math.round((event.loaded * 100) / event.total) });
        },
      });

      // 3. 登记文件，获取 file_record_id
      const registeredFile: FileRecordRead = await registerFile({
        object_name: policy.object_name,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        profile_name: options.profileName,
      });

      // 4. 通过 onSuccess 将完整的 FileRecordRead 对象返回给调用方
      onSuccess(registeredFile);
      return registeredFile;

    } catch (error: any) {
      message.error(`上传失败: ${error.message || '未知错误'}`);
      onError(error);
      throw error;
    } finally {
      isUploading.value = false;
    }
  };

  return {
    isUploading,
    customRequest,
  };
}
