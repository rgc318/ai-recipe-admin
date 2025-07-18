// 文件路径: src/api/management/user.ts

import type {
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
// /**
//  * @description 创建新用户
//  */
// export function createUser(data: UserCreate) {
//   // 正确的调用方式: post(url, data)
//   return requestClient.post<StandardResponse<UserItem>>(API_PREFIX, data);
// }
//
// /**
//  * @description 更新用户信息
//  */
// export function updateUser(id: number | string, data: UserUpdate) {
//   // 正确的调用方式: put(url, data)
//   return requestClient.put<StandardResponse<UserItem>>(
//     `${API_PREFIX}/${id}`,
//     data,
//   );
// }
//
// /**
//  * @description 删除用户
//  */
// export function deleteUser(id: number | string) {
//   // 正确的调用方式: delete(url)
//   return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
// }
/**
 * @description 获取用户列表 (分页、排序、过滤)
 * @param params - 强类型的查询参数
 */
// export function getUserListPage(params: UserListParams) {
//   return requestClient.get<StandardResponse<PageResponse<UserReadWithRoles>>>(
//     `${API_PREFIX}/`,
//     { params },
//   );
// }

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
 * @description 获取单个用户详情
 * @param userId - 用户的UUID
 */
export function getUserDetails(userId: string) {
  return requestClient.get<StandardResponse<UserReadWithRoles>>(`${API_PREFIX}/${userId}`);
}
