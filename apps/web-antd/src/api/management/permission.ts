// 文件路径: src/api/management/permission.ts

import type { StandardResponse, PageResponse } from '#/api/types';
import { requestClient } from '#/api/request';
// 假设你的类型定义在 #/views/management/permission/types.ts
import type {
  PermissionRead,
  PermissionSelector,
  PermissionSyncResponse
} from '#/views/management/permission/types';

const API_PREFIX = '/permission'; // 后端权限 API 主路径

/**
 * @description 获取权限列表 (支持分页、排序和过滤)
 * @param params - 查询参数, e.g., { page: 1, per_page: 10, search: '用户' }
 */
export function listPermissionsPaginated(params: any) {
  return requestClient.get<StandardResponse<PageResponse<PermissionRead>>>(
    `${API_PREFIX}/`,
    { params },
  );
}

/**
 * @description 【后端中心模式 - 推荐】从服务器配置文件同步权限
 * 此接口不接收任何请求体，后端会自动读取自己的配置文件。
 */
export function syncPermissionsFromSource() {
  return requestClient.post<StandardResponse<PermissionSyncResponse>>(
    `${API_PREFIX}/sync-from-source`,
  );
}

/**
 * @description 【前端驱动模式 - 备用】根据请求体内容同步权限
 * 此接口的灵活性更高，允许前端传递权限定义。
 * @param data 权限字典列表
 */
export function syncPermissionsFromPayload(data: Record<string, any>[]) {
  return requestClient.post<StandardResponse<PermissionSyncResponse>>(
    `${API_PREFIX}/sync-from-payload`,
    data,
  );
}

/**
 * @description 获取所有权限列表（用于下拉选择器）
 * 内置一个高的 limit 来获取所有数据，实际项目可替换为专门的 /selector 接口
 */
/**
 * @description 获取所有权限列表（用于下拉选择器）
 */
export function getPermissionsForSelector() {
  // 1. 调用专门的 /selector 接口
  return requestClient.get<StandardResponse<PermissionSelector[]>>(
    `${API_PREFIX}/selector`,
  );
}
/**
 * 注意：
 * 根据我们的设计，权限的创建、更新和删除是由“同步”功能管理的，
 * 因此不再需要为前端提供手动的 createPermission, updatePermission, deletePermission 等 API 调用。
 * 这使得权限管理更加安全和可控。
 */
