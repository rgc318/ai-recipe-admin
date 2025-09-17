// 文件路径: src/views/management/role/useRoleManagement.ts

import { ref, reactive, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';
import { h } from 'vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';

// 导入所有需要的 API 函数
import {
  listRolesPaginated,
  softDeleteRoles,
  restoreRoles,
  permanentDeleteRoles,
} from '#/api/management/users/role';
import type { RoleReadWithPermissions, RoleListParams } from './types';
import type { PageResponse } from '#/api/types';

export function useRoleManagement() {
  // 1. 将原 Store 中的 State 移到这里
  const loading = ref(false);
  const tableData = reactive<PageResponse<RoleReadWithPermissions>>({
    items: [], total: 0, page: 1, per_page: 10, total_pages: 0,
  });
  const searchParams = reactive({
    search: undefined,
    view_mode: 'active',
  });
  const selectedRowKeys = ref<string[]>([]);

  const mergeModalRef = ref<any>(null); // 用于引用模态框组件实例

  const openMergeModal = () => {
    if (selectedRowKeys.value.length >= 2) {
      // 上下文模式：从表格数据中过滤出完整的角色对象
      const selectedRoles = tableData.items.filter(item => selectedRowKeys.value.includes(item.id));
      mergeModalRef.value?.open(selectedRoles);
    } else {
      // 全局模式
      mergeModalRef.value?.open();
    }
  };


  // 2. 将原 Store 中的 fetchData 移到这里
  async function fetchData(params?: Partial<RoleListParams>) {
    loading.value = true;
    try {
      const finalParams = {
        page: tableData.page,
        per_page: tableData.per_page,
        sort: '-created_at', // 默认排序
        ...searchParams,
        ...params,
      };
      const response = await listRolesPaginated(finalParams);
      Object.assign(tableData, response);
    } catch (error) {
      message.error('获取角色列表失败');
    } finally {
      loading.value = false;
    }
  }

  // 3. 派生状态和事件处理器 (大部分逻辑与 tag 模块一致)
  const hasSelected = computed(() => selectedRowKeys.value.length > 0);
  const rowSelection = computed(() => ({
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys: string[]) => { selectedRowKeys.value = keys; },
  }));
  const pagination = computed(() => ({
    current: tableData.page,
    pageSize: tableData.per_page,
    total: tableData.total,
    showTotal: (total: number) => `共 ${total} 条`,
    showSizeChanger: true,
  }));

  const handleTableChange: TableProps['onChange'] = (page, _filters, sorter: any) => {
    const sort = sorter.field && sorter.order ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}` : undefined;
    fetchData({ page: page.current, per_page: page.pageSize, sort });
  };

  const refreshAfterOperation = () => {
    // 刷新逻辑可以简化为重新搜索第一页
    handleSearch();
  };

  const handleSearch = () => fetchData({ page: 1 });
  const handleReset = () => {
    Object.assign(searchParams, { search: undefined, view_mode: 'active' });
    handleSearch();
  };

  const createConfirmModal = (title: string, content: string, onOk: () => Promise<void>) => {
    Modal.confirm({
      title,
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content,
      async onOk() {
        try {
          await onOk();
          selectedRowKeys.value = [];
          refreshAfterOperation();
        } catch (error) {
          // API 层的全局错误处理器会显示 message
        }
      },
    });
  };

  const handleDelete = (record: RoleReadWithPermissions) => {
    createConfirmModal(
      '确定要删除此角色吗？',
      `角色“${record.name}”将被移入回收站。`,
      async () => {
        await softDeleteRoles({ role_ids: [record.id] });
        message.success('删除成功');
      }
    );
  };

  const handleBatchDelete = () => {
    if (!hasSelected.value) return;
    createConfirmModal(
      '确定要批量删除吗？',
      `即将把 ${selectedRowKeys.value.length} 个角色移入回收站。`,
      async () => {
        await softDeleteRoles({ role_ids: selectedRowKeys.value });
        message.success('批量删除成功');
      }
    );
  };

  // 【新增】一个专门用于处理单行恢复的方法
  const handleRestoreRow = (record: RoleReadWithPermissions) => {
    createConfirmModal(
      '确定要恢复此角色吗？',
      `角色“${record.name}”将从回收站中恢复。`,
      async () => {
        await restoreRoles({ role_ids: [record.id] });
        message.success('恢复成功');
      }
    );
  };

  const handleRestore = () => {
    if (!hasSelected.value) return;
    createConfirmModal(
      '确定要批量恢复吗？',
      `即将从回收站恢复 ${selectedRowKeys.value.length} 个角色。`,
      async () => {
        await restoreRoles({ role_ids: selectedRowKeys.value });
        message.success('恢复成功');
      }
    );
  };

  // 【新增】一个专门用于处理单行永久删除的方法
  const handlePermanentDeleteRow = (record: RoleReadWithPermissions) => {
    // 我们可以复用 createConfirmModal 来显示警告
    createConfirmModal(
      '确定要永久删除吗？',
      h('div', { style: { color: 'red' } }, [
        h('p', `即将从数据库中彻底移除角色“${record.name}”。`),
        h('p', '此操作不可恢复，请谨慎操作！'),
      ]),
      async () => {
        await permanentDeleteRoles({ role_ids: [record.id] });
        message.success('永久删除操作已执行');
      }
    );
  };

  const handlePermanentDelete = () => {
    if (!hasSelected.value) return;
    createConfirmModal(
      '确定要永久删除吗？',
      h('div', { style: { color: 'red' } }, [
        h('p', `即将从数据库中彻底移除 ${selectedRowKeys.value.length} 个角色。`),
        h('p', '此操作不可恢复，且只有未被使用的角色才能成功删除！'),
      ]),
      async () => {
        await permanentDeleteRoles({ role_ids: selectedRowKeys.value });
        message.success('永久删除操作已执行');
      }
    );
  };

  onMounted(handleSearch);

  return {
    loading, tableData, searchParams, pagination,
    selectedRowKeys, hasSelected, rowSelection,
    handleTableChange, handleSearch, handleReset, handleDelete,
    handleBatchDelete, handleRestore, handlePermanentDelete,
    refreshData: handleSearch,
    mergeModalRef,    // <-- 暴露 ref
    handleRestoreRow,
    handlePermanentDeleteRow,
    openMergeModal,   // <-- 暴露新方法
  };
}
