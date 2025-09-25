// 文件位置: src/views/content/file/useFileManagement.ts

import { ref, reactive, computed, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableProps } from 'ant-design-vue';
import type { PageResponse } from '#/api/types';
import type { FileRecordRead, FileDeleteCheckResponse } from './types';

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

  // --- 辅助函数，用于显示确认对话框 ---
  const showConfirmationModal = (response: FileDeleteCheckResponse, ids: string[]) => {
    Modal.confirm({
      title: '警告：文件正在被使用',
      icon: h(QuestionCircleOutlined, { style: { color: 'orange' } }),
      content: h('div', {}, [
        h('p', response.message),
        h('p', '以下文件正在被其他模块引用：'),
        h('ul', { style: { paddingLeft: '20px', maxHeight: '150px', overflowY: 'auto' } },
          response.in_use_files?.map(file => h('li', file))
        ),
        h('p', { style: { marginTop: '10px', fontWeight: 'bold' } }, '如果继续，这些地方的图片或文件链接将会失效。您确定要继续吗？'),
      ]),
      okText: '强制删除',
      okType: 'danger',
      async onOk() {
        // 用户确认后，发送 force=true 的请求
        const finalResponse = await batchSoftDeleteFileRecords({ record_ids: ids }, true);
        message.success(finalResponse.message);
        fetchData();
      },
    });
  };
  // =================================================================
  //                    生命周期操作 (增删改查)
  // =================================================================

  // --- 软删除 ---
  const handleSoftDelete = async (record: FileRecordRead) => {
    loading.value = true;
    try {
      // 直接调用批量接口，传入单个ID
      const response = await batchSoftDeleteFileRecords({ record_ids: [record.id] }, false);

      if (response.status === 'success') {
        message.success(response.message);
        fetchData();
      } else if (response.status === 'warning' && response.needs_confirmation) {
        showConfirmationModal(response, [record.id]);
      }
    } finally {
      loading.value = false;
    }
  };

  // --- 批量软删除 ---
  const handleBatchSoftDelete = async () => {
    if (!hasSelected.value) return;
    loading.value = true;
    try {
      const ids = selectedRowKeys.value;
      // 1. 发送预检请求 (force=false)
      const response = await batchSoftDeleteFileRecords({ record_ids: ids }, false);

      // 2. 根据响应进行判断
      if (response.status === 'success') {
        // 如果所有文件都可安全删除，后端直接删除并返回成功
        message.success(response.message);
        fetchData();
      } else if (response.status === 'warning' && response.needs_confirmation) {
        // 如果有文件被使用，弹出二次确认框
        showConfirmationModal(response, ids);
      } else {
        // 处理其他可能的错误情况
        message.error(response.message || '发生未知错误');
      }
    } finally {
      loading.value = false;
    }
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
