// 文件路径: src/views/management/permission/usePermissionManagement.ts
import { ref, reactive, computed, onMounted, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableProps } from 'ant-design-vue';
import {
  listPermissionsPaginated,
  syncPermissionsFromSource,
  permanentDeletePermissions,
} from '#/api/management/users/permission';
import type { PermissionRead, PermissionListParams } from './types';
import type { PageResponse } from '#/api/types';
import {uniqBy} from "lodash-es";

export function usePermissionManagement() {
  const loading = ref(false);
  const syncLoading = ref(false); // 为同步操作创建独立的 loading 状态
  const tableData = reactive<PageResponse<PermissionRead>>({
    items: [], total: 0, page: 1, per_page: 10, total_pages: 0,
  });
  const searchParams = reactive({
    group: undefined,
    search: undefined,
    view_mode: 'active',
  });
  const selectedRowKeys = ref<string[]>([]);

  // 【核心修正1】创建一个独立的、稳定的状态来存储所有分组选项
  const allPermissionGroups = ref<{ label: string; value: string }[]>([]);

  // 用于分组筛选器的选项，从数据中动态生成
  const permissionGroupOptions = computed(() =>
    uniqBy(tableData.items.map(p => ({ label: p.group, value: p.group })), 'value')
  );

  async function fetchData(params?: Partial<PermissionListParams>) {
    loading.value = true;
    try {
      const finalParams = {
        page: tableData.page, per_page: tableData.per_page, sort: 'group,name',
        ...searchParams, ...params,
      };
      const response = await listPermissionsPaginated(finalParams);
      Object.assign(tableData, response);

      if (tableData.items.length > 0) {
        const newGroups = tableData.items.map(p => ({ label: p.group, value: p.group }));
        allPermissionGroups.value = uniqBy([...allPermissionGroups.value, ...newGroups], 'value');
      }

    } catch (error) { message.error('获取权限列表失败'); }
    finally { loading.value = false; }
  }

  const handleTableChange: TableProps['onChange'] = (page, _filters, sorter: any) => {
    const sort = sorter.field && sorter.order ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}` : undefined;
    fetchData({ page: page.current, per_page: page.pageSize, sort });
  };

  const handleSearch = () => fetchData({ page: 1 });
  const handleReset = () => {
    Object.assign(searchParams, { group: undefined, search: undefined, view_mode: 'active' });
    handleSearch();
  };

  const handleSyncPermissions = async () => {
    syncLoading.value = true;
    try {
      const result = await syncPermissionsFromSource();
      message.success(
        `同步完成！新增: ${result.created}, 更新: ${result.updated}, 禁用: ${result.disabled}, 启用: ${result.enabled}`,
        6,
      );
      handleSearch();
    } finally {
      syncLoading.value = false;
    }
  };

  const handlePermanentDelete = () => {
    if (selectedRowKeys.value.length === 0) return;
    Modal.confirm({
      title: '确定要永久删除吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: h('div', { style: { color: 'red' } }, [
        h('p', `即将从数据库中彻底移除 ${selectedRowKeys.value.length} 个权限。`),
        h('p', '此操作不可恢复，且只有未被使用的权限才能成功删除！'),
      ]),
      okText: '确认永久删除',
      okType: 'danger',
      async onOk() {
        try {
          await permanentDeletePermissions({ permission_ids: selectedRowKeys.value });
          message.success('清理操作已执行');
          selectedRowKeys.value = [];
          handleSearch();
        } catch (error) { /* 全局拦截器处理 */ }
      },
    });
  };

  onMounted(fetchData);

  return {
    loading, syncLoading, tableData, searchParams, pagination: computed(() => ({
      current: tableData.page, pageSize: tableData.per_page, total: tableData.total,
      showTotal: (total: number) => `共 ${total} 条`, showSizeChanger: true,
    })),
    selectedRowKeys,
    hasSelected: computed(() => selectedRowKeys.value.length > 0),
    rowSelection: computed(() => ({
      selectedRowKeys: selectedRowKeys.value,
      onChange: (keys: string[]) => { selectedRowKeys.value = keys; },
    })),
    permissionGroupOptions: allPermissionGroups,
    handleTableChange, handleSearch, handleReset, handleSyncPermissions, handlePermanentDelete,
    refreshData: handleSearch,

  };
}
