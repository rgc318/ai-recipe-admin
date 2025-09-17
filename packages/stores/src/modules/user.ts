// 【第一步：导入中心化的类型定义】
// 我们不再在本地定义 UserInfo，而是从项目的类型包中导入。
// 这确保了整个应用都使用同一个、唯一的 UserInfo 类型。
import type { UserInfo } from '@vben-core/typings';

import { acceptHMRUpdate, defineStore } from 'pinia';

// 【第二步：升级 State 接口】
// 在状态中为权限列表开辟专门的存储空间。
interface UserState {
  /**
   * 完整的用户信息上下文对象
   */
  userInfo: null | UserInfo;
  /**
   * 【新增】单独存储的权限列表，用于前端进行精细的权限判断
   */
  userPermissions: string[];
  /**
   * 单独存储的角色列表，方便快速访问
   */
  userRoles: string[];
}

/**
 * @zh_CN 用户信息与权限状态管理
 */
export const useUserStore = defineStore('core-user', {
  // 【第三步：更新 State 初始化】
  state: (): UserState => ({
    userInfo: null,
    userRoles: [],
    userPermissions: [], // 初始化权限列表为空数组
  }),

  getters: {
    /**
     * 【你要求的方法】直接获取完整的 userInfo 对象
     * @param state - 当前 store 的 state
     * @returns UserInfo 对象或 null
     */
    getUserInfo(state): null | UserInfo {
      console.log('1. [userStore Getter] Getting userInfo:', state.userInfo); // <--- 添加关键日志1
      return state.userInfo;
    },

    /**
     * 【核心】将 is_superuser 的判断逻辑也封装成一个 getter
     * 这是最佳实践，让 Store 自己负责解释自己的数据。
     * @param state - 当前 store 的 state
     * @returns boolean
     */
    isSuperuser(state): boolean {
      const superuserStatus = !!state.userInfo?.is_superuser;
      console.log('2. [userStore Getter] Getting isSuperuser status:', superuserStatus); // <--- 添加关键日志2
      return superuserStatus;
    },
  },

  // 【第四步：增强 Actions】
  actions: {
    /**
     * 设置完整的用户上下文信息。
     * 这是从后端获取数据后，更新前端状态的核心入口。
     * @param info 从 /users/me 接口获取的完整 UserInfo 对象
     */
    setUserInfo(info: null | UserInfo) {
      // 统一存储完整的用户信息对象，便于UI展示
      this.userInfo = info;

      // 分离存储角色和权限，便于进行快速的权限检查
      this.setUserRoles(info?.roles ?? []);
      this.setUserPermissions(info?.permissions ?? []);
    },
    /**
     * 单独设置用户角色列表。
     * @param roles 角色代码字符串数组
     */
    setUserRoles(roles: string[]) {
      this.userRoles = roles;
    },
    /**
     * 【新增】单独设置用户权限列表。
     * @param permissions 权限代码字符串数组
     */
    setUserPermissions(permissions: string[]) {
      this.userPermissions = permissions;
    },
    /**
     * 【新增】一个核心的权限检查辅助函数。
     * @param permissionCode 需要检查的权限代码，例如 "user:create"
     * @returns boolean 是否拥有该权限
     */
    hasPermission(permissionCode: string): boolean {
      // 如果是超级用户，直接拥有所有权限
      if (this.userInfo?.is_superuser) {
        return true;
      }
      // 否则，检查权限列表是否包含所需的权限码
      return this.userPermissions.includes(permissionCode);
    },
  },
});

// HMR (热模块替换) 配置，保持不变
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
