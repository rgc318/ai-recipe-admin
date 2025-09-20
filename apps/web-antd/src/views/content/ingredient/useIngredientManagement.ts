// 文件位置: src/views/content/ingredient/useIngredientManagement.ts

import { ref, reactive, computed, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { PageResponse } from '#/api/types';

// [核心] 导入 Ingredient 相关的类型和 API 函数
import type { IngredientRead } from './types';
import {
  listIngredientsPaginated,
  softDeleteSingleIngredient,
  batchSoftDeleteIngredients,
  restoreIngredients,
  permanentDeleteIngredients,
} from '#/api/content/ingredient';


export function useIngredientManagement() {
  // --- 状态定义 (State) ---
  const loading = ref(false);
  const tableData = reactive<PageResponse<IngredientRead>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });
  const selectedRowKeys = ref<string[]>([]);
  const searchParams = reactive({
    search: undefined,
    view_mode: 'active', // 'active', 'all', 'deleted'
  });
  const hasSelected = computed(() => selectedRowKeys.value.length > 0);

  // --- 核心数据获取 ---
  async function fetchData(params?: any) {
    loading.value = true;
    try {
      const finalParams = {
        page: tableData.page,
        per_page: tableData.per_page,
        ...searchParams,
        ...params,
      };
      // 调用食材列表 API
      const response = await listIngredientsPaginated(finalParams);
      Object.assign(tableData, response);
      selectedRowKeys.value = [];
    } catch (error) {
      // 全局错误拦截器已处理
    } finally {
      loading.value = false;
    }
  }

  // --- 表格交互处理 ---
  const pagination = computed(() => ({
    current: tableData.page,
    pageSize: tableData.per_page,
    total: tableData.total,
    showTotal: (total: number) => `共 ${total} 条`,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  }));

  const handleTableChange: TableProps['onChange'] = (page, _filters, sorter: any) => {
    // 适配食材的默认排序
    const sort = sorter.field && sorter.order
      ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`
      : 'name'; // 默认按名称升序
    fetchData({ page: page.current, per_page: page.pageSize, sort });
  };

  const handleSearch = () => {
    fetchData({ page: 1 });
  };

  const handleReset = () => {
    searchParams.search = undefined;
    handleSearch();
  };

  // --- 生命周期操作 ---

  const handleDeleteIngredient = (record: IngredientRead) => {
    Modal.confirm({
      title: '确定要删除此食材吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: `食材 “${record.name}” 将被移入回收站。`,
      async onOk() {
        await softDeleteSingleIngredient(record.id);
        message.success('删除成功');
        fetchData();
      },
    });
  };

  const handleBatchSoftDelete = () => {
    if (!hasSelected.value) return;
    Modal.confirm({
      title: '确定要批量删除选中的食材吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: `即将删除 ${selectedRowKeys.value.length} 个食材。`,
      async onOk() {
        await batchSoftDeleteIngredients({ ingredient_ids: selectedRowKeys.value });
        message.success('批量删除成功');
        fetchData();
      },
    });
  };

  const handleRestoreIngredients = (ids: string[]) => {
    if (ids.length === 0) return;
    Modal.confirm({
      title: '确定要恢复选中的食材吗？',
      icon: h(QuestionCircleOutlined),
      content: `即将恢复 ${ids.length} 个食材。`,
      async onOk() {
        await restoreIngredients({ ingredient_ids: ids });
        message.success('恢复成功');
        fetchData();
      },
    });
  };

  const handlePermanentDeleteIngredients = (ids: string[], recordName?: string) => {
    Modal.confirm({
      title: '确定要永久删除吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: h('div', { style: { color: 'red' } }, [
        h('p', `即将从数据库中彻底移除 ${ids.length} 个食材。`),
        h('p', '此操作不可恢复，请谨慎操作！'),
        recordName ? h('p', `项目: ${recordName}`) : null,
      ]),
      okText: '确认永久删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await permanentDeleteIngredients({ ingredient_ids: ids });
        message.success('已永久删除');
        fetchData();
      },
    });
  };

  // --- 暴露给视图 ---
  return {
    loading,
    tableData,
    searchParams,
    pagination,
    selectedRowKeys,
    hasSelected,

    fetchData: handleSearch,
    handleTableChange,
    handleSearch,
    handleReset,

    handleDeleteIngredient,
    handleBatchSoftDelete,
    handleRestoreIngredients,
    handlePermanentDeleteIngredients,
  };
}
