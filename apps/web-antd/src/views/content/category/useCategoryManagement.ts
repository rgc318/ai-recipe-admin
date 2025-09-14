import { ref, reactive, computed, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import {
  listCategoriesPaginated,
  deleteCategory,
  batchDeleteCategories,
  restoreCategories,
  permanentDeleteCategories,
} from '#/api/content/category';
import type { CategoryRead } from './types';
import type { PageResponse } from '#/api/types';

export function useCategoryManagement() {
  const loading = ref(false);
  const tableData = reactive<PageResponse<CategoryRead>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });
  const selectedRowKeys = ref<string[]>([]);
  const searchParams = reactive({
    name: undefined, // 按名称模糊搜索
    view_mode: 'active',
  });

  async function fetchData(params?: any) {
    loading.value = true;
    try {
      const finalParams = {
        page: tableData.page,
        per_page: tableData.per_page,
        ...searchParams,
        ...params,
      };
      const response = await listCategoriesPaginated(finalParams);
      Object.assign(tableData, response);
      selectedRowKeys.value = [];
    } catch (error) {
      message.error('获取分类列表失败');
    } finally {
      loading.value = false;
    }
  }

  const pagination = computed(() => ({
    current: tableData.page,
    pageSize: tableData.per_page,
    total: tableData.total,
    showTotal: (total: number) => `共 ${total} 条`,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  }));

  const handleTableChange: TableProps['onChange'] = (page, _filters, sorter: any) => {
    const sort = sorter.field && sorter.order
      ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`
      : 'name';
    fetchData({ page: page.current, per_page: page.pageSize, sort });
  };

  const handleSearch = () => {
    fetchData({ page: 1 });
  };

  const handleReset = () => {
    searchParams.name = undefined;
    handleSearch();
  };

  const handleDeleteCategory = (record: CategoryRead) => {
    Modal.confirm({
      title: '确定要删除此分类吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: `分类“${record.name}”将被移入回收站。`,
      async onOk() {
        await deleteCategory(record.id);
        message.success('删除成功');
        fetchData();
      },
    });
  };

  const handleRestoreCategories = (ids: string[]) => {
    Modal.confirm({
      title: '确定要恢复选中的分类吗？',
      content: `即将恢复 ${ids.length} 个分类。`,
      async onOk() {
        await restoreCategories({ category_ids: ids });
        message.success('恢复成功');
        fetchData();
      },
    });
  };

  const handlePermanentDeleteCategories = (ids: string[], recordName?: string) => {
    Modal.confirm({
      title: '确定要永久删除吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: h('div', { style: { color: 'red' } }, [
        h('p', `即将从数据库中彻底移除 ${ids.length} 个分类。`),
        h('p', '此操作不可恢复，请谨慎操作！'),
        recordName ? h('p', `项目: ${recordName}`) : null,
      ]),
      okText: '确认永久删除',
      okType: 'danger',
      async onOk() {
        await permanentDeleteCategories({ category_ids: ids });
        message.success('已永久删除');
        fetchData();
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请至少选择一个分类');
      return;
    }
    Modal.confirm({
      title: '确定要批量删除选中的分类吗？',
      content: `即将删除 ${selectedRowKeys.value.length} 个分类。`,
      async onOk() {
        await batchDeleteCategories({ category_ids: selectedRowKeys.value });
        message.success('批量删除成功');
        fetchData();
      },
    });
  };

  return {
    loading,
    tableData,
    searchParams,
    pagination,
    selectedRowKeys,
    handleTableChange,
    handleSearch,
    handleReset,
    handleDeleteCategory,
    handleBatchDelete,
    handleRestoreCategories,
    handlePermanentDeleteCategories,
    fetchData: handleSearch,
  };
}
