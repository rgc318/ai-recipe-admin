// src/store/modules/recipe.ts

import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';

import type { PageResponse } from '#/api/types';
import type { RecipeRead, RecipeListParams, CategoryRead, TagRead } from '#/views/management/recipe/types';
import { getRecipeListPage } from '#/api/management/recipes/recipe';
import { getAllTags } from '#/api/management/recipes/tag'; // 假设已创建
// import { getAllCategories } from '#/api/management/category'; // 未来会用到

// 初始化的筛选条件
const initialSearchParams: Omit<RecipeListParams, 'page' | 'per_page' | 'sort'> = {
  title: undefined,
  status: undefined,
  category_id: undefined,
  tag_ids: undefined,
  author_id: undefined,
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

  // 用于筛选器的选项列表
  const categoriesForSelector = ref<CategoryRead[]>([]);
  const tagsForSelector = ref<TagRead[]>([]);

  // --- 动作 (Actions) ---

  // 获取列表数据
  async function fetchData(params: RecipeListParams) {
    loading.value = true;
    try {
      const response = await getRecipeListPage(params);
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

  // 获取用于筛选器的初始数据
  async function fetchInitialSelectors() {
    try {
      // Promise.all 可以并行加载
      const [tagsResponse /*, categoriesResponse */] = await Promise.all([
        getAllTags(),
        // getAllCategories(), // 未来启用
      ]);
      tagsForSelector.value = tagsResponse.items.map(t => ({ id: t.id, name: t.name }));
      // categoriesForSelector.value = categoriesResponse.items;
    } catch (error) {
      message.error('加载筛选器选项失败');
    }
  }

  // 重置搜索条件
  function resetState() {
    Object.assign(searchParams, initialSearchParams);
  }

  // 完整的 Pinia Store 重置
  function $reset() {
    loading.value = false;
    Object.assign(tableData, { items: [], total: 0, page: 1, per_page: 10, total_pages: 0 });
    Object.assign(searchParams, initialSearchParams);
    categoriesForSelector.value = [];
    tagsForSelector.value = [];
  }

  return {
    loading,
    tableData,
    searchParams,
    categoriesForSelector,
    tagsForSelector,
    fetchData,
    fetchInitialSelectors,
    resetState,
    $reset
  };
});
