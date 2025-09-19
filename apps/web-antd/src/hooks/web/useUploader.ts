// 文件位置: src/composables/useUploader.ts

import { ref, readonly } from 'vue';
import { message } from 'ant-design-vue';

// [重构] - 导入我们所有的工具函数，不再需要 axios
import {
  generatePresignedUploadPolicy,
  registerFile,
  uploadToCloud // <-- 导入我们的新工具
} from '#/api/content/file';

import type {
  UploadResult,
  RegisterFilePayload,
  PresignedPolicyPayload
} from '#/views/content/files/types';

/**
 * @description 【最终优化版】一个通用的、处理客户端直传到云存储的 Composable。
 */
export function useUploader() {

  // --- 1. 状态管理 (保持不变) ---
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const progress = ref(0);
  const uploadResult = ref<UploadResult | null>(null);

  // --- 2. 通用的核心上传方法 (已重构) ---
  const upload = async (
    file: File,
    profileName: string,
    pathParams: Record<string, any> = {},
    onProgressCallback?: (percent: number) => void
  ): Promise<UploadResult> => {
    isLoading.value = true;
    error.value = null;
    progress.value = 0;
    uploadResult.value = null;

    try {
      // 步骤 A: 申请上传凭证 (逻辑不变)
      const policyPayload: PresignedPolicyPayload = {
        profile_name: profileName,
        original_filename: file.name,
        content_type: file.type,
        path_params: pathParams,
      };
      const policyData = await generatePresignedUploadPolicy(policyPayload);

      // 步骤 B: 【【核心重构】】调用底层的物理上传工具函数
      const etag = await uploadToCloud(policyData, file, (percent) => {
        progress.value = percent;       // 更新 hook 内部的进度状态
        onProgressCallback?.(percent);  // 调用外部传入的回调 (给 antdv 等使用)
      });

      // 步骤 C: 向后端登记 (逻辑不变)
      const registerPayload: RegisterFilePayload = {
        object_name: policyData.object_name,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        profile_name: profileName,
        etag: etag,
      };

      const finalResult = await registerFile(registerPayload);
      uploadResult.value = finalResult;
      message.success('上传并登记成功！');
      return finalResult;

    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || '上传失败，发生未知错误。';
      error.value = errorMessage;
      message.error(errorMessage);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // --- 3. 兼容 antdv 的 customRequest (保持不变) ---
  const customRequest = async ({ file, onSuccess, onError, onProgress, data }: any) => {
    const profileName = data?.profileName || 'general_files';
    const pathParams = data?.pathParams || {};

    try {
      const result = await upload(
        file,
        profileName,
        pathParams,
        (percent) => onProgress({ percent })
      );
      onSuccess?.(result);
    } catch (e) {
      onError?.(e);
    }
  };

  // --- 4. 暴露给外部 (保持不变) ---
  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    progress: readonly(progress),
    uploadResult: readonly(uploadResult),
    upload,
    customRequest,
  };
}
