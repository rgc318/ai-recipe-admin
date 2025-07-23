import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';

// 1. 【修正】导入正确的新函数名 syncPermissionsFromSource
import { listPermissionsPaginated, syncPermissionsFromSource } from '#/api/management/permission';
// 导入前端的权限定义文件，仅在需要“前端驱动”模式时使用
// import { permissionsToSync } from '#/config/permissions.config';
import type { PermissionRead } from './types';
import type { PageResponse } from '#/api/types';
import { $t } from '#/locales';
import { permissionGroupOptions } from '#/config/permissions.config';
/**
 * @description 权限管理页面的业务逻辑 Hook
 */
export function usePermissionManagement() {
  const loading = ref(false);
  const tableData = reactive<PageResponse<PermissionRead>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });

  const searchParams = reactive({
    group: undefined,
    search: undefined,
  });

  // 核心数据获取逻辑
  async function fetchData(params: any) {
    loading.value = true;
    try {
      const response = await listPermissionsPaginated(params);
      Object.assign(tableData, response);
    } catch (error) {
      message.error('获取权限列表失败');
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

// =================================================================
  // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 核心修改点 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  // =================================================================
  const handleTableChange: TableProps['onChange'] = (page, _filters, sorter: any) => {
    // 1. 构造与新后端匹配的排序字符串
    // 例如: { field: 'name', order: 'descend' } -> '-name'
    const sort = (sorter.field && sorter.order)
      ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`
      : undefined; // 如果没有排序，则不传此参数，让后端使用默认排序

    fetchData({
      page: page.current,
      per_page: page.pageSize,
      sort: sort, // 2. 使用正确的参数名 `sort`
      ...searchParams,
    });
  };

  const handleSearch = () => {
    // 搜索时，重置到第一页并使用默认排序
    fetchData({
      page: 1,
      per_page: tableData.per_page,
      sort: 'group,name', // 3. 使用正确的参数名和格式
      ...searchParams,
    });
  };
  // =================================================================

  const handleReset = () => {
    searchParams.group = undefined;
    searchParams.search = undefined;
    handleSearch();
  };

  // 同步权限的核心方法
  const handleSyncPermissions = async () => {
    loading.value = true;
    try {
      // 2. 【修正】调用正确的新函数 syncPermissionsFromSource
      const result = await syncPermissionsFromSource();
      message.success(
        `权限同步成功！总数: ${result.total}, 新增: ${result.created}, 已存在: ${result.found}`,
        5, // 将成功消息显示5秒，方便查看
      );
      // 同步成功后刷新列表
      handleSearch();
    } catch (error) {
      message.error($t('page.permission.syncFailed'));
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    tableData,
    searchParams,
    pagination,
    permissionGroupOptions, // 将导入的 options 直接返回
    handleTableChange,
    handleSearch,
    handleReset,
    handleSyncPermissions,
    fetchData: handleSearch, // 暴露给刷新按钮
  };
}
