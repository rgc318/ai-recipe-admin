import type {RoleItem} from "#/views/management/role/types";

export interface UserItem {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'user';
  status: 'active' | 'disabled';
  createdAt: string;
}


export interface UserReadWithRoles {
  id: string; // UUID
  username: string;
  email?: string | null;
  phone?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  full_avatar_url?: string | null; // 【新增】这是我们需要的完整、可访问的URL
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  is_locked: boolean;
  created_at: string; // datetime string
  updated_at: string; // datetime string
  last_login_at?: string | null; // datetime string
  roles: RoleItem[]; // 嵌套的角色信息数组
  permissions: string[]; // Set<str> 在JSON中通常是字符串数组
}

/**
 * 用户列表查询参数 (对应后端 Query 参数)
 */
export interface UserListParams {
  page?: number;
  per_page?: number;
  // 【修改二】将 order_by 重命名为 sort，与后端 API 参数对齐
  sort?: string;   // 例如: "-created_at,username"
  username?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  role_ids?: string[];
  full_name?: string; // 示例：为未来扩展做准备
}

/**
 * 创建用户的请求体 (对应后端的 UserCreate)
 */
export interface UserCreateData {
  username: string;
  password: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  // 创建用户时可以直接分配角色
  role_ids?: string[];
}

/**
 * 更新用户的请求体 (对应后端的 UserUpdate)
 */
export interface UserUpdateData {
  password?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
  is_locked?: boolean;
  role_ids?: string[]; // 全量更新用户的角色列表
}



// 【新增】为安全的POST策略请求创建请求体类型
export interface PresignedPolicyRequest {
  original_filename: string;
  content_type: string;
}

// 【新增】为安全的POST策略响应创建类型
export interface PresignedUploadPolicy {
  url: string;
  fields: Record<string, any>;
  object_name: string;
  final_url: string;
}

// 【新增】为闭环接口创建请求体类型
export interface AvatarLinkDTO {
  object_name: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  etag?: string | null;
}

/**
 * 用户更新自己个人资料的请求体
 * 只包含允许用户自己修改的字段
 */
export interface UserUpdateProfileData {
  full_name?: string | null;
  email?: string | null;
  // 注意：不应包含 is_active, is_superuser 等管理员才能修改的字段
}

/**
 * 用户修改自己密码的请求体
 */
export interface UserChangePasswordData {
  old_password: string;
  new_password: string;
}
