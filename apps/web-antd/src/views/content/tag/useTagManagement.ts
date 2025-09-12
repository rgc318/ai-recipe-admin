import { ref, reactive, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';
import { listTagsPaginated, deleteTag, batchDeleteTags, restoreTags, permanentDeleteTags } from '#/api/content/tag';
import type { TagRead } from './types';
import type { PageResponse } from '#/api/types';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import { h } from 'vue';

export function useTagManagement() {
  const loading = ref(false);
  const tableData = reactive<PageResponse<TagRead>>({
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

  async function fetchData(params?: any) {
    loading.value = true;
    try {
      const finalParams = {
        page: tableData.page,
        per_page: tableData.per_page,
        ...searchParams,
        ...params,
      };
      const response = await listTagsPaginated(finalParams);
      Object.assign(tableData, response);
      selectedRowKeys.value = []; // 刷新后清空选择
    } catch (error) {
      message.error('获取标签列表失败');
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
      : '-recipe_count,name';
    fetchData({ page: page.current, per_page: page.pageSize, sort });
  };

  const handleSearch = () => {
    fetchData({ page: 1 });
  };

  const handleReset = () => {
    searchParams.search = undefined;
    handleSearch();
  };

  const handleDeleteTag = (record: TagRead) => {
    Modal.confirm({
      title: '确定要删除此标签吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: `标签“${record.name}”将被移入回收站。`,
      async onOk() {
        try {
          await deleteTag(record.id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          // 全局错误拦截器已处理
        }
      },
    });
  };

  const handleRestoreTags = (ids: string[]) => {
    Modal.confirm({
      title: '确定要恢复选中的标签吗？',
      icon: h(QuestionCircleOutlined),
      content: `即将恢复 ${ids.length} 个标签。`,
      async onOk() {
        await restoreTags({ tag_ids: ids });
        message.success('恢复成功');
        fetchData();
      },
    });
  };

  const handlePermanentDeleteTags = (ids: string[], recordName?: string) => {
    Modal.confirm({
      title: '确定要永久删除吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: h('div', { style: { color: 'red' } }, [
        h('p', `即将从数据库中彻底移除 ${ids.length} 个标签。`),
        h('p', '此操作不可恢复，请谨慎操作！'),
        recordName ? h('p', `项目: ${recordName}`) : null,
      ]),
      okText: '确认永久删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        await permanentDeleteTags({ tag_ids: ids });
        message.success('已永久删除');
        fetchData();
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.value.length === 0) {
      message.warning('请至少选择一个标签');
      return;
    }
    Modal.confirm({
      title: '确定要批量删除选中的标签吗？',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: `即将删除 ${selectedRowKeys.value.length} 个标签。`,
      async onOk() {
        try {
          await batchDeleteTags({ tag_ids: selectedRowKeys.value });
          message.success('批量删除成功');
          fetchData();
        } catch (error) {
          // 全局错误拦截器已处理
        }
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
    handleDeleteTag,
    handleBatchDelete,
    handleRestoreTags, // <-- 暴露新方法
    handlePermanentDeleteTags, // <-- 暴露新方法
    fetchData: handleSearch, // 暴露给刷新按钮
  };
}
