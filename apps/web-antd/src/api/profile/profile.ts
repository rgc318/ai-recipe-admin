// 文件路径: src/api/profile.ts

import type {
  // --- 复用已有的类型 ---
  UserReadWithRoles,
  PresignedPolicyRequest,
  PresignedUploadPolicy,
  AvatarLinkDTO,
  // --- 需要在 types.ts 中新增的类型 ---
  UserUpdateProfileData,
  UserChangePasswordData,
} from '#/views/management/user/types'; // 假设类型都定义在这里

import { requestClient } from '#/api/request';
import type { StandardResponse } from '#/api/types';

// 为个人中心模块定义专门的 API 前缀
const API_ME_PREFIX = '/user';


/**
 * @description 更新当前登录用户的基本信息 (如：全名, 邮箱)
 * @param data 包含要更新字段的对象
 */
export function updateMyProfile(data: UserUpdateProfileData) {
  // 使用 PATCH 更符合部分更新的语义
  return requestClient.patch<StandardResponse<UserReadWithRoles>>(
    `${API_ME_PREFIX}/me`,
    data,
  );
}

/**
 * @description 当前登录用户修改自己的密码
 * @param data 包含旧密码和新密码的对象
 */
export function changeMyPassword(data: UserChangePasswordData) {
  return requestClient.patch<StandardResponse<null>>( // 通常修改密码成功后无需返回数据
    `${API_ME_PREFIX}/me/password`,
    data,
  );
}

/**
 * @description 为当前用户上传新头像 (直接上传模式)
 * @param file 头像文件
 */
export function updateMyAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return requestClient.patch<StandardResponse<UserReadWithRoles>>(
    `${API_ME_PREFIX}/me/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/**
 * @description (从 user.ts 移动过来) 为上传新头像生成预签名POST策略
 * @param data 包含文件名和文件类型的对象
 */
export function generateMyAvatarUploadPolicy(data: PresignedPolicyRequest) {
  return requestClient.post<StandardResponse<PresignedUploadPolicy>>(
    `${API_ME_PREFIX}/me/avatar/generate-upload-policy`,
    data,
  );
}

/**
 * @description (从 user.ts 移动过来) 关联已通过预签名URL上传的头像
 * @param data 包含所有文件元数据的对象
 */
export function linkMyUploadedAvatar(data: AvatarLinkDTO) {
  return requestClient.patch<StandardResponse<UserReadWithRoles>>(
    `${API_ME_PREFIX}/me/avatar/link-uploaded-file`,
    data,
  );
}

