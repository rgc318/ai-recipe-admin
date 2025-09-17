import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';

import type { PageResponse } from '#/api/types';
import type { UserReadWithRoles, UserListParams } from '#/views/management/user/types';
import type { RoleSelectorItem } from '#/views/management/role/types';
import { getUserListPage } from '#/api/management/users/user';
import { getRolesForSelector } from '#/api/management/users/role';

// 初始化的筛选条件
const initialSearchParams = {
  username: undefined,
  email: undefined,
  phone: undefined,
  is_active: undefined,
  role_ids: undefined,
  view_mode: 'active',
};

export const useUserSearchStore = defineStore('user-search', () => {
  // --- 状态 (State) ---
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

      // 【核心修复】使用 .map() 创建一个新数组和新的对象
      // 这会强制Vue的响应式系统进行深度更新，确保所有组件都能接收到最新的数据。
      tableData.items = response.items.map(item => ({ ...item }));
      // 这能保证 Vue 正确追踪到 items 数组的变化
      tableData.total = response.total;
      tableData.page = response.page;
      tableData.per_page = response.per_page;
      tableData.total_pages = response.total_pages;

    } catch (error: any) {
      message.error(`数据加载失败: ${error.message || '请重试'}`);
      error.value = error; // <-- 设置错误状态
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
