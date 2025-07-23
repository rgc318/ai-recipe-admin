// 文件路径: src/api/management/user.ts

import type {
  AvatarLinkDTO,
  PresignedPolicyRequest, PresignedUploadPolicy,
  UserCreateData,
  UserItem,
  UserListParams,
  UserReadWithRoles,
  UserUpdateData
} from '#/views/management/user/types';

import { requestClient } from '#/api/request';
import type { StandardResponse, PageResponse } from '#/api/types';

const API_PREFIX = '/user'; // 后端 API 主路径

/**
 * @description 【安全模式】为上传新头像生成预签名POST策略
 * @param data 包含文件名和文件类型的对象
 */
export function generateAvatarUploadPolicy(data: PresignedPolicyRequest) {
  return requestClient.post<StandardResponse<PresignedUploadPolicy>>(
    `${API_PREFIX}/me/avatar/generate-upload-policy`,
    data,
  );
}


/**
 * @description 关联已通过预签名URL上传的头像
 * @param data 包含所有文件元数据的对象
 */
export function linkUploadedAvatar(data: AvatarLinkDTO) {
  return requestClient.patch<StandardResponse<UserReadWithRoles>>(
    `${API_PREFIX}/me/avatar/link-uploaded-file`,
    data,
  );
}


/**
 * @description 获取用户列表
 */
export function getUserList(params: any) {
  // 正确的调用方式: get(url, { params })
  return requestClient.get<
    StandardResponse<PageResponse<UserItem>>
  >(
    API_PREFIX, // 第一个参数：URL 字符串
    { params }, // 第二个参数：包含 params 的配置对象
  );
}


/**
 * @description 【管理员】为指定用户上传头像（直接上传）
 * @param userId 用户的UUID
 * @param file 头像文件
 */
export function adminUpdateUserAvatar(userId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return requestClient.patch<StandardResponse<UserReadWithRoles>>(
    `${API_PREFIX}/${userId}/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/**
 * 【修改二】保留唯一的、使用强类型参数的分页获取函数
 * @description 获取用户列表 (动态分页、排序、过滤)
 * @param params - 强类型的查询参数对象
 */
export function getUserListPage(params: UserListParams) {
  return requestClient.get<StandardResponse<PageResponse<UserReadWithRoles>>>(
    `${API_PREFIX}/`,
    { params },
  );
}

/**
 * @description 创建新用户
 * @param data - 创建用户的数据
 */
export function createUser(data: UserCreateData) {
  return requestClient.post<StandardResponse<UserReadWithRoles>>(`${API_PREFIX}/`, data);
}

/**
 * @description 更新用户信息
 * @param userId - 用户的UUID
 * @param data - 更新的数据
 */
export function updateUser(userId: string, data: UserUpdateData) {
  return requestClient.put<StandardResponse<UserReadWithRoles>>(
    `${API_PREFIX}/${userId}`,
    data,
  );
}

/**
 * @description (软)删除用户
 * @param userId - 用户的UUID
 */
export function deleteUser(userId: string) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${userId}`);
}

/**
 * @description 批量(软)删除用户
 * @param data - 包含 user_ids 列表的对象
 */
export function batchDeleteUsers(data: { user_ids: string[] }) {
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/batch`, { data });
}

/**
 * @description 获取单个用户详情
 * @param userId - 用户的UUID
 */
export function getUserDetails(userId: string) {
  return requestClient.get<StandardResponse<UserReadWithRoles>>(`${API_PREFIX}/${userId}`);
}
