// 文件位置: src/views/content/file/useFileManagement.ts

import { ref, reactive, computed, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableProps } from 'ant-design-vue';
import type { PageResponse } from '#/api/types';
import type { FileRecordRead } from './types';

// 导入我们刚刚创建的 API 函数
import {
  listFileRecords,
  softDeleteFileRecord,
  restoreFileRecords,
  permanentDeleteFileRecord,
  batchSoftDeleteFileRecords,
  batchPermanentDeleteFileRecords,
} from '#/api/content/file-record';

export function useFileManagement() {
  // =================================================================
  //                         状态定义 (State)
  // =================================================================
  const loading = ref(false);

  const tableData = reactive<PageResponse<FileRecordRead>>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 0,
  });

  const selectedRowKeys = ref<string[]>([]);

  const searchParams = reactive({
    view_mode: 'active', // 'active', 'all', 'deleted'
    original_filename: undefined,
    profile_name: undefined,
    content_type: undefined,
  });
// [新增] - 增加一个计算属性，方便模板中使用
  const hasSelected = computed(() => selectedRowKeys.value.length > 0);

  // =================================================================
  //                         核心数据获取
  // =================================================================
  async function fetchData(params?: any) {
    loading.value = true;
    try {
      // 组合所有查询参数
      const finalParams = {
        page: tableData.page,
        per_page: tableData.per_page,
        ...searchParams,
        ...params,
      };
      // 清理空参数
      Object.keys(finalParams).forEach(key => {
        if (finalParams[key] === '' || finalParams[key] === undefined) {
          delete finalParams[key];
        }
      });

      const response = await listFileRecords(finalParams);
      Object.assign(tableData, response);
      selectedRowKeys.value = []; // 刷新后清空选择
    } catch (error) {
      // API请求函数中通常有全局错误处理，这里可以留空或做特定提示
      // message.error('获取文件列表失败');
    } finally {
      loading.value = false;
    }
  }

  // =================================================================
  //                         表格交互处理
  // =================================================================
  const pagination = computed(() => ({
    current: tableData.page,
    pageSize: tableData.per_page,
    total: tableData.total,
    showTotal: (total: number) => `共 ${total} 条`,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  }));

  const handleTableChange: TableProps['onChange'] = (page, _filters, sorter: any) => {
    // AntdVue 的 sorter.order 可能是 false，需要处理
    const sortOrder = sorter.order ? (sorter.order === 'descend' ? '-' : '') : '';
    const sortField = sorter.field || 'created_at';
    const sort = sortOrder ? `${sortOrder}${sortField}` : '-created_at';

    tableData.page = page.current!;
    tableData.per_page = page.pageSize!;
    fetchData({ sort });
  };

  const handleSearch = () => {
    tableData.page = 1; // 搜索时重置到第一页
    fetchData();
  };

  const handleReset = () => {
    // 重置所有过滤参数
    searchParams.original_filename = undefined;
    searchParams.profile_name = undefined;
    searchParams.content_type = undefined;
    handleSearch();
  };

  // =================================================================
  //                    生命周期操作 (增删改查)
  // =================================================================

  // --- 软删除 ---
  const handleSoftDelete = (record: FileRecordRead) => {
    Modal.confirm({
      title: '移入回收站',
      icon: h(QuestionCircleOutlined),
      content: `确定要删除文件记录 "${record.original_filename}" 吗？`,
      async onOk() {
        await softDeleteFileRecord(record.id);
        message.success('已移入回收站');
        fetchData();
      },
    });
  };

  // --- 批量软删除 ---
  const handleBatchSoftDelete = () => {
    if (!hasSelected.value) return;
    Modal.confirm({
      title: '批量移入回收站',
      icon: h(QuestionCircleOutlined),
      content: `确定要删除选中的 ${selectedRowKeys.value.length} 条文件记录吗？`,
      async onOk() {
        // [修正] - 调用我们最终实现的批量软删除API
        await batchSoftDeleteFileRecords({ record_ids: selectedRowKeys.value });
        message.success('批量删除成功');
        fetchData();
      },
    });
  };

  // --- 恢复 ---
  const handleRestore = (ids: string[]) => {
    if (ids.length === 0) return;
    Modal.confirm({
      title: '恢复文件记录',
      icon: h(QuestionCircleOutlined),
      content: `确定要恢复选中的 ${ids.length} 条记录吗？`,
      async onOk() {
        await restoreFileRecords({ record_ids: ids });
        message.success('恢复成功');
        fetchData(); // 恢复后通常会跳回 'active' 视图，或者保持在 'deleted' 视图刷新
      },
    });
  };

  // --- 永久删除 ---
  const handlePermanentDelete = (record: FileRecordRead) => {
    Modal.confirm({
      title: '警告：永久删除',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: h('div', { style: { color: 'red' } }, [
        h('p', `即将彻底删除文件 "${record.original_filename}" 的记录及其物理文件。`),
        h('p', '此操作不可恢复，请谨慎操作！'),
      ]),
      okText: '确认永久删除',
      okType: 'danger',
      async onOk() {
        await permanentDeleteFileRecord(record.id);
        message.success('已永久删除');
        fetchData();
      },
    });
  };

  // --- 批量永久删除 ---
  const handleBatchPermanentDelete = () => {
    if (selectedRowKeys.value.length === 0) return;
    Modal.confirm({
      title: '警告：批量永久删除',
      icon: h(QuestionCircleOutlined, { style: { color: 'red' } }),
      content: h('div', { style: { color: 'red' } }, [
        h('p', `即将彻底删除选中的 ${selectedRowKeys.value.length} 条记录及其物理文件。`),
        h('p', '此操作不可恢复，请谨慎操作！'),
      ]),
      okText: '确认永久删除',
      okType: 'danger',
      async onOk() {
        // [修正] - 调用我们最终实现的批量永久删除API
        await batchPermanentDeleteFileRecords({ record_ids: selectedRowKeys.value });
        message.success('已批量永久删除');
        fetchData();
      },
    });
  };


  // =================================================================
  //                         暴露给视图
  // =================================================================
  return {
    loading,
    tableData,
    searchParams,
    pagination,
    selectedRowKeys,

    fetchData,
    handleTableChange,
    handleSearch,
    handleReset,
    hasSelected,
    handleSoftDelete,
    handleBatchSoftDelete,
    handleRestore,
    handlePermanentDelete,
    handleBatchPermanentDelete,
  };
}
