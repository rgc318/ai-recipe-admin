// /src/views/recipe/unit/useUnitManagement.ts

import { ref, reactive, computed, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import {
  listUnitsPaginated,
  deleteUnit,
  batchDeleteUnits,
  restoreUnits,
  permanentDeleteUnits,
} from '#/api/content/unit'; // [优化] 移除不再需要的 createUnit 和 updateUnit
import type { UnitRead } from './types';
import type { PageResponse } from '#/api/types';

export function useUnitManagement() {
  const loading = ref(false);
  const tableData = reactive<PageResponse<UnitRead>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });
  const selectedRowKeys = ref<string[]>([]);
  const searchParams = reactive({
    name: undefined,
    view_mode: 'active', // 'active', 'all', 'deleted'
  });

  // [保留并优化] 核心数据获取逻辑
  async function fetchData(params?: any) {
    loading.value = true;
    try {
      // [优化] 将所有参数合并到一个对象中传递
      const finalParams = {
        page: tableData.page,
        per_page: tableData.per_page,
        ...searchParams,
        ...params, // 允许外部传入覆盖，例如排序和不同的分页
      };
      const response = await listUnitsPaginated(finalParams);
      Object.assign(tableData, response);
      selectedRowKeys.value = []; // 刷新后清空选择
    } catch (error) {
      message.error('获取单位列表失败');
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
      : '-ingredient_count,name'; // [优化] 添加默认排序
    fetchData({ page: page.current, per_page: page.pageSize, sort });
  };

  const handleSearch = () => {
    // [优化] 直接调用 fetchData，它会使用最新的 searchParams
    fetchData({ page: 1 });
  };

  const handleReset = () => {
    searchParams.name = undefined;
    handleSearch();
  };

  // [移除] handleAddNew, handleEdit, handleModalOk 函数
  // [移除] modalVisible, modalLoading, modalTitle, currentUnit 状态

  // [重命名并优化] 单个删除操作
  const handleDeleteUnit = (record: UnitRead) => {
    Modal.confirm({
      title: '确定要删除此单位吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: `单位“${record.name}”将被移入回收站。`, // [优化] 更新提示为软删除
      async onOk() {
        await deleteUnit(record.id);
        message.success('删除成功');
        fetchData(); // 只需刷新表格
      },
    });
  };

  // [保留] 批量删除、恢复、永久删除逻辑，它们已经是最佳实践
  const handleRestoreUnits = (ids: string[]) => {
    Modal.confirm({
      title: '确定要恢复选中的单位吗？',
      icon: h(QuestionCircleOutlined),
      content: `即将恢复 ${ids.length} 个单位。`,
      async onOk() {
        await restoreUnits({ unit_ids: ids });
        message.success('恢复成功');
        fetchData();
      },
    });
  };

  const handlePermanentDeleteUnits = (ids: string[], recordName?: string) => {
    Modal.confirm({
      title: '确定要永久删除吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: h('div', { style: { color: 'red' } }, [
        h('p', `即将从数据库中彻底移除 ${ids.length} 个单位。`),
        h('p', '此操作不可恢复，请谨慎操作！'),
        recordName ? h('p', `项目: ${recordName}`) : null,
      ]),
      okText: '确认永久删除',
      okType: 'danger',
      async onOk() {
        await permanentDeleteUnits({ unit_ids: ids });
        message.success('已永久删除');
        fetchData();
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请至少选择一个单位');
      return;
    }
    Modal.confirm({
      title: '确定要批量删除选中的单位吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: `即将删除 ${selectedRowKeys.value.length} 个单位。`,
      async onOk() {
        await batchDeleteUnits({ unit_ids: selectedRowKeys.value });
        message.success('批量删除成功');
        fetchData();
      },
    });
  };

  // [优化] 返回一个更干净、职责更专一的对象
  return {
    loading,
    tableData,
    searchParams,
    pagination,
    selectedRowKeys,
    handleTableChange,
    handleSearch,
    handleReset,
    handleDeleteUnit, // 使用新名称
    handleBatchDelete,
    handleRestoreUnits,
    handlePermanentDeleteUnits,
    fetchData: handleSearch, // 暴露给刷新按钮
  };
}
