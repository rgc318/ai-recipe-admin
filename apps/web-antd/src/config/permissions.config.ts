/**
 * 权限定义文件 - Single Source of Truth
 *
 * 1. permissionsToSync:
 * - 一个包含权限完整信息的数组，用于“同步权限”功能。
 * - 开发者在此处维护权限的 code, name, group 等元数据。
 *
 * 2. Permissions (Enum-like Object):
 * - 一个自动生成的、键值对形式的权限对象，用于在代码中安全地引用权限代码。
 * - 它消除了“魔法字符串”，提供了 IDE 自动补全，并使得重构变得简单。
 */

// ----------------------------------------------------------------
// 步骤一：保留我们用于“同步”的原始数组
// ----------------------------------------------------------------
export const permissionsToSync = [
  {
    code: 'dashboard:view',
    name: '查看仪表盘',
    group: '仪表盘',
    description: '允许用户查看分析页和工作台。',
  },
  {
    code: 'management:user:list',
    name: '查看用户列表',
    group: '用户管理',
    description: '允许用户查看用户分页列表。',
  },
  {
    code: 'management:user:create',
    name: '创建用户',
    group: '用户管理',
    description: '允许用户创建新用户。',
  },
  {
    code: 'management:user:update',
    name: '编辑用户',
    group: '用户管理',
    description: '允许用户更新现有用户信息。',
  },
  {
    code: 'management:user:delete',
    name: '删除用户',
    group: '用户管理',
    description: '允许用户删除用户。',
  },
  // ... 其他所有权限
];

// ----------------------------------------------------------------
// 步骤二：自动生成一个易于在代码中使用的“权限枚举”对象
// ----------------------------------------------------------------
function generatePermissionsEnum(
  permissionList: typeof permissionsToSync,
): Record<string, string> {
  const permissionEnum: Record<string, string> = {};
  for (const perm of permissionList) {
    // 将 'management:user:list' 转换为 'MANAGEMENT_USER_LIST'
    const key = perm.code.replace(/[:\-]/g, '_').toUpperCase();
    permissionEnum[key] = perm.code;
  }
  return permissionEnum;
}

/**
 * 从权限配置中自动提取所有唯一的分组，并格式化为适用于 Ant Design Select 组件的 options 格式。
 * @returns {{ label: string, value: string }[]}
 */
function getUniquePermissionGroupOptions(
  permissionList: typeof permissionsToSync,
): { label: string; value: string }[] {
  const groups = new Set(permissionList.map((p) => p.group));
  // 将字符串数组转换为对象数组
  return Array.from(groups)
    .sort()
    .map((groupName) => ({
      label: groupName, // 用于显示
      value: groupName, // 用于提交
    }));
}
/**
 * 在代码中使用的权限枚举对象。
 * @example
 * import { Permissions } from '#/config/permissions.config';
 * if (hasPermission(Permissions.MANAGEMENT_USER_CREATE)) {
 * // ...
 * }
 */
export const Permissions = generatePermissionsEnum(permissionsToSync);
/**
 * 可在整个应用中使用的、唯一的权限分组列表。
 * @example
 * import { permissionGroups } from '#/config/permissions.config';
 * // 在 Vue 组件中使用 permissionGroups 来渲染下拉选项
 */
export const permissionGroupOptions = getUniquePermissionGroupOptions(permissionsToSync);
