import { onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { message } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';

// 【第一步】导入我们刚刚创建的 Pinia Store
import { useUserSearchStore } from '#/store/modules/userSearch';

// 【第二步】只导入视图层需要的类型和少量的 API 函数
import type { UserReadWithRoles } from '#/views/management/user/types';
import { deleteUser } from '#/api/management/user';


/**
 * @description 连接视图(index.vue)和逻辑中心(Pinia Store)的 Composable (最终版)
 * @returns 供 index.vue 使用的所有响应式状态和方法
 */
export function useUserManagement() {
  // 【第三步】实例化 store
  const userStore = useUserSearchStore();

  // 【第四步】从 store 中解构出 State 和 Action
  // 使用 storeToRefs 来确保解构出的所有 state 都是响应式的
  const { loading, tableData, rolesForSelector, searchParams } = storeToRefs(userStore);
  const { fetchData, fetchRoles, resetState } = userStore;

  // --- 事件处理器 (现在它们只负责调用 store 的 action) ---

  const handleTableChange: TableProps['onChange'] = (page, filters, sorter) => {
    // 从 Ant Design 的 sorter 对象中构建排序字符串
    const sort = (sorter && !Array.isArray(sorter) && sorter.field && sorter.order)
      ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`
      : undefined;

    // 调用 store 的 fetchData action，并传入所有最新参数
    fetchData({
      page: page.current,
      per_page: page.pageSize,
      sort,
      ...searchParams.value,
    });
  };

  const handleSearch = () => {
    // 搜索时，重置到第一页，然后触发一次数据获取
    // 我们可以复用 handleTableChange 的逻辑
    handleTableChange(
      { current: 1, pageSize: tableData.value.per_page },
      {},
      {}
    );
  };

  const handleReset = () => {
    // 调用 store 的 resetState action 来清空筛选条件
    resetState();
    // 然后执行一次搜索来刷新数据
    handleSearch();
  };

  const handleDeleteUser = async (record: UserReadWithRoles) => {
    try {
      await deleteUser(record.id);
      message.success(`用户 [${record.username}] 删除成功`);

      // 如果当前页只剩一条数据且不是第一页，则请求上一页
      const currentPage = (tableData.value.items.length === 1 && tableData.value.page > 1)
        ? tableData.value.page - 1
        : tableData.value.page;

      // 重新获取数据
      handleTableChange(
        { current: currentPage, pageSize: tableData.value.per_page },
        {},
        {}
      );
    } catch (error: any) {
      message.error(`删除失败: ${error.message || '未知错误'}`);
    }
  }

  // --- 生命周期 ---
  onMounted(() => {
    // 组件挂载时，触发 store 的 action 来获取初始数据
    handleSearch(); // 初始加载等同于一次搜索
    fetchRoles();
  });

  // 【第五步】返回所有视图层(index.vue)需要用到的东西
  return {
    loading,
    tableData,
    rolesForSelector,
    searchParams,
    // 【重要】 pagination 对象现在直接从 tableData 中派生，保持数据源唯一
    pagination: computed(() => ({
      current: tableData.value.page,
      pageSize: tableData.value.per_page,
      total: tableData.value.total,
      showTotal: (total: number) => `共 ${total} 条`,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
    })),
    handleTableChange,
    handleSearch,
    handleReset,
    handleDeleteUser,
    // 将 handleSearch 暴露为 fetchData，供 UserDrawer 的 @success 事件回调使用
    // 这能确保新增/编辑用户后，表格会重置到第一页并刷新
    fetchData: handleSearch,
  };
}
