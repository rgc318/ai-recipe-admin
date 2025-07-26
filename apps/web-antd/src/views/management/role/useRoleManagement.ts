// 文件路径: src/views/management/role/useRoleManagement.ts
import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';
import { listRolesPaginated, deleteRole } from '#/api/management/users/role';
import type { RoleReadWithPermissions } from './types';
import type { PageResponse } from '#/api/types';

export function useRoleManagement() {
  const loading = ref(false);
  const tableData = reactive<PageResponse<RoleReadWithPermissions>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });

  const searchParams = reactive({
    search: undefined,
  });

  async function fetchData(params: any) {
    loading.value = true;
    try {
      const response = await listRolesPaginated(params);
      Object.assign(tableData, response);
    } catch (error) {
      message.error('获取角色列表失败');
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
      : undefined;

    fetchData({
      page: page.current,
      per_page: page.pageSize,
      sort: sort,
      ...searchParams,
    });
  };

  const handleSearch = () => {
    fetchData({
      page: 1,
      per_page: tableData.per_page,
      sort: '-created_at',
      ...searchParams,
    });
  };

  const handleReset = () => {
    searchParams.search = undefined;
    handleSearch();
  };

  const handleDeleteRole = async (record: RoleReadWithPermissions) => {
    try {
      await deleteRole(record.id);
      message.success('删除成功');
      // 如果删除的是当前页的最后一条数据，页码需要向前调整
      if (tableData.items.length === 1 && tableData.page > 1) {
        tableData.page -= 1;
      }
      handleSearch();
    } catch (error) {
      // 错误消息已在全局拦截器中处理
    }
  };

  return {
    loading,
    tableData,
    searchParams,
    pagination,
    handleTableChange,
    handleSearch,
    handleReset,
    handleDeleteRole,
    fetchData: handleSearch,
  };
}
