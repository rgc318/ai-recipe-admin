// src/views/management/recipe/useRecipeManagement.ts

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useRecipeSearchStore } from '#/store/modules/recipe'; // 假设已创建
import { storeToRefs } from 'pinia';
import type { TableProps } from 'ant-design-vue';
import type { RecipeRead } from './types';
import { deleteRecipe, batchDeleteRecipes } from '#/api/management/recipes/recipe'; // 假设已创建

export function useRecipeManagement() {
  const router = useRouter();
  const recipeStore = useRecipeSearchStore();

  const { loading, tableData, searchParams, categoriesForSelector, tagsForSelector } =
    storeToRefs(recipeStore);

  const { fetchData, fetchInitialSelectors, resetState } = recipeStore;

  const selectedRowKeys = ref<string[]>([]);

  // --- 核心事件处理器 ---

  const handleTableChange: TableProps['onChange'] = (page, filters, sorter) => {
    const sort =
      sorter && !Array.isArray(sorter) && sorter.field && sorter.order
        ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`
        : '-created_at'; // 默认排序

    fetchData({
      page: page.current,
      per_page: page.pageSize,
      sort,
      ...searchParams.value,
    });
  };

  const handleSearch = () => {
    fetchData({
      page: 1,
      per_page: tableData.value.per_page,
      sort: '-created_at',
      ...searchParams.value,
    });
  };

  const handleReset = () => {
    resetState();
    handleSearch();
  };

  // --- 导航 ---
  const handleCreate = () => {
    router.push({ name: 'RecipeEditor', params: { id: 'create' } });
  };

  const handleEdit = (record: RecipeRead) => {
    router.push({ name: 'RecipeEditor', params: { id: record.id } });
  };

  // --- 删除操作 ---

  const refreshTableAfterDelete = () => {
    const isLastItemOnPage =
      selectedRowKeys.value.length >= tableData.value.items.length &&
      tableData.value.page > 1;
    const currentPage = isLastItemOnPage ? tableData.value.page - 1 : tableData.value.page;
    selectedRowKeys.value = [];
    fetchData({
      page: currentPage,
      per_page: tableData.value.per_page,
      ...searchParams.value,
    });
  };

  const handleDelete = async (record: RecipeRead) => {
    try {
      selectedRowKeys.value = [record.id];
      await deleteRecipe(record.id);
      message.success(`菜谱 [${record.title}] 删除成功`);
      refreshTableAfterDelete();
    } catch (error: any) {
      message.error(`删除失败: ${error.message || '未知错误'}`);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请至少选择一项');
      return;
    }
    try {
      await batchDeleteRecipes({ recipe_ids: selectedRowKeys.value });
      message.success(`成功删除 ${selectedRowKeys.value.length} 个菜谱`);
      refreshTableAfterDelete();
    } catch (error: any) {
      message.error(`批量删除失败: ${error.message || '未知错误'}`);
    }
  };

  onMounted(() => {
    handleSearch(); // 初始加载
    fetchInitialSelectors(); // 加载筛选器所需的数据
  });

  return {
    loading,
    tableData,
    pagination: computed(() => ({
      current: tableData.value.page,
      pageSize: tableData.value.per_page,
      total: tableData.value.total,
      showTotal: (total: number) => `共 ${total} 条`,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
    })),
    searchParams,
    categoriesForSelector,
    tagsForSelector,
    selectedRowKeys,
    hasSelected: computed(() => selectedRowKeys.value.length > 0),
    rowSelection: computed(() => ({
      selectedRowKeys: selectedRowKeys.value,
      onChange: (keys: string[]) => {
        selectedRowKeys.value = keys;
      },
    })),
    handleTableChange,
    handleSearch,
    handleReset,
    handleCreate,
    handleEdit,
    handleDelete,
    handleBatchDelete,
    refreshData: handleSearch, // 提供一个刷新方法
  };
}
