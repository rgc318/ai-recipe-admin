// src/store/modules/recipe.ts

import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';

import type { PageResponse } from '#/api/types';
// 【修改】导入树形分类类型
import type { RecipeRead, RecipeListParams, CategoryReadWithChildren } from '#/views/content/recipe/types';
import { getRecipeListPage } from '#/api/recipes/recipe';
// 【修改】导入新的 category tree API
import { getCategoryTree } from '#/api/management/category';

// 初始筛选条件保持不变，非常棒
const initialSearchParams: Omit<RecipeListParams, 'page' | 'per_page' | 'sort'> = {
  title: undefined,
  category_ids: [],
  tag_ids: [],
};

export const useRecipeSearchStore = defineStore('recipe-search', () => {
  // --- 状态 (State) ---
  const loading = ref(false);
  const tableData = reactive<PageResponse<RecipeRead>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });
  const searchParams = reactive({ ...initialSearchParams });

  // 【修改】用于“列表页筛选器”的分类选项，现在是树形结构
  const categoriesForSelector = ref<CategoryReadWithChildren[]>([]);

  // --- 动作 (Actions) ---

  // fetchData 函数逻辑正确，无需修改
  async function fetchData(params: RecipeListParams) {
    loading.value = true;
    try {
      const cleanParams = { ...params };
      if (!cleanParams.title) delete cleanParams.title;
      if (!cleanParams.category_ids?.length) delete cleanParams.category_ids;
      if (!cleanParams.tag_ids?.length) delete cleanParams.tag_ids;

      const response = await getRecipeListPage(cleanParams);
      tableData.items = response.items;
      tableData.total = response.total;
      tableData.page = response.page;
      tableData.per_page = response.per_page;
      tableData.total_pages = response.total_pages;
    } catch (error: any) {
      message.error(`菜谱数据加载失败: ${error.message || '请重试'}`);
      tableData.items = [];
      tableData.total = 0;
    } finally {
      loading.value = false;
    }
  }

  // 【修改】获取“列表页筛选器”所需的初始数据
  async function fetchInitialSelectors() {
    try {
      // 调用新的 API，它直接返回树形结构，非常高效
      const categoriesTree = await getCategoryTree();
      categoriesForSelector.value = categoriesTree;
      // TODO 已解决：不再需要将扁平列表转换为树状结构
    } catch (error) {
      message.error('加载分类筛选列表失败');
    }
  }

  // 重置搜索条件 (无需修改)
  function resetState() {
    Object.assign(searchParams, initialSearchParams);
  }

  // 完整的 Pinia Store 重置 (无需修改)
  function $reset() {
    loading.value = false;
    Object.assign(tableData, { items: [], total: 0, page: 1, per_page: 10, total_pages: 0 });
    Object.assign(searchParams, initialSearchParams);
    categoriesForSelector.value = [];
  }

  return {
    loading,
    tableData,
    searchParams,
    categoriesForSelector,
    fetchData,
    fetchInitialSelectors,
    resetState,
    $reset,
  };
});
