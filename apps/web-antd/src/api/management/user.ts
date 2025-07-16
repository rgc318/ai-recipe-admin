// 文件路径: src/api/management/user.ts

import type { UserItem } from '#/views/management/user/types';

import { requestClient } from '#/api/request';

// --- 类型定义 ---
type UserCreate = Omit<UserItem, 'createdAt' | 'id'>;
type UserUpdate = Partial<Omit<UserItem, 'createdAt' | 'id'>>;
interface StandardResponse<T> {
  code: number;
  message: string;
  data: T;
}

const API_PREFIX = '/user'; // 后端 API 主路径

/**
 * @description 获取用户列表
 */
export function getUserList(params: any) {
  // 正确的调用方式: get(url, { params })
  return requestClient.get<
    StandardResponse<{ list: UserItem[]; total: number }>
  >(
    API_PREFIX, // 第一个参数：URL 字符串
    { params }, // 第二个参数：包含 params 的配置对象
  );
}

/**
 * @description 创建新用户
 */
export function createUser(data: UserCreate) {
  // 正确的调用方式: post(url, data)
  return requestClient.post<StandardResponse<UserItem>>(API_PREFIX, data);
}

/**
 * @description 更新用户信息
 */
export function updateUser(id: number | string, data: UserUpdate) {
  // 正确的调用方式: put(url, data)
  return requestClient.put<StandardResponse<UserItem>>(
    `${API_PREFIX}/${id}`,
    data,
  );
}

/**
 * @description 删除用户
 */
export function deleteUser(id: number | string) {
  // 正确的调用方式: delete(url)
  return requestClient.delete<StandardResponse<null>>(`${API_PREFIX}/${id}`);
}
