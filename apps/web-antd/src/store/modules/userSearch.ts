import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';

import type { PageResponse } from '#/api/types';
import type { UserReadWithRoles, UserListParams } from '#/views/management/user/types';
import type { RoleSelectorItem } from '#/views/management/role/types';
import { getUserListPage } from '#/api/management/user';
import { getRolesForSelector } from '#/api/management/role';

// 初始化的筛选条件
const initialSearchParams = {
  username: undefined,
  email: undefined,
  phone: undefined,
  is_active: undefined,
  role_ids: undefined,
};

export const useUserSearchStore = defineStore('user-search', () => {
  // --- 状态 (State) ---
  // 使用 ref 和 reactive 来定义状态
  const loading = ref(false);
  const tableData = reactive<PageResponse<UserReadWithRoles>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });
  const rolesForSelector = ref<RoleSelectorItem[]>([]);
  const searchParams = reactive<Omit<UserListParams, 'page' | 'per_page' | 'sort'>>({
    ...initialSearchParams
  });

  // --- 动作 (Actions) ---
  async function fetchData(params: UserListParams) {
    loading.value = true;
    try {
      const response = await getUserListPage(params);
      // 使用 Object.assign 来更新 reactive 对象
      Object.assign(tableData, response);
      tableData.page = params.page || 1;
      tableData.per_page = params.per_page || 10;
    } catch (error: any) {
      message.error(`数据加载失败: ${error.message || '请重试'}`);
      tableData.items = [];
      tableData.total = 0;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoles() {
    try {
      rolesForSelector.value = await getRolesForSelector();
    } catch (error) {
      message.error('加载角色筛选列表失败');
    }
  }

  function resetState() {
    Object.assign(searchParams, initialSearchParams);
    tableData.page = 1;
  }

  // Pinia 的 $reset 方法
  function $reset() {
    loading.value = false;
    Object.assign(tableData, {
      items: [],
      total: 0,
      page: 1,
      per_page: 10,
      total_pages: 0,
    });
    rolesForSelector.value = [];
    Object.assign(searchParams, initialSearchParams);
  }


  // --- 返回 ---
  // 将所有状态和方法都 return 出去
  return {
    loading,
    tableData,
    rolesForSelector,
    searchParams,
    fetchData,
    fetchRoles,
    resetState,
    $reset
  };
});
