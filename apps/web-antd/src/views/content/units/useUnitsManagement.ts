import { ref, reactive, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import type { TableProps } from 'ant-design-vue';

import { listUnitsPaginated, createUnit, updateUnit, deleteUnit } from '#/api/content/unit';
import type { UnitRead, UnitCreate, UnitUpdate } from './types';
import type { PageResponse } from '#/api/types';
import { useRecipeReferenceStore } from '#/store/modules/recipeReference';

export function useUnitManagement() {
  const loading = ref(false);
  const tableData = reactive<PageResponse<UnitRead>>({
    items: [], total: 0, page: 1, per_page: 10, total_pages: 0,
  });
  const searchParams = reactive({ name: undefined });
  const recipeReferenceStore = useRecipeReferenceStore();

  // --- Modal 相关状态 ---
  const modalVisible = ref(false);
  const modalLoading = ref(false);
  const modalTitle = ref<'create' | 'edit'>('create');
  const currentUnit = ref<Partial<UnitRead>>({});

  // 核心数据获取 (分页、排序、筛选)
  async function fetchData(params?: any) {
    loading.value = true;
    try {
      const response = await listUnitsPaginated(params);
      Object.assign(tableData, response);
    } catch (error) {
      message.error('获取单位列表失败');
    } finally {
      loading.value = false;
    }
  }

  const pagination = computed(() => ({
    current: tableData.page, pageSize: tableData.per_page, total: tableData.total,
    showTotal: (total: number) => `共 ${total} 条`,
    showSizeChanger: true, pageSizeOptions: ['10', '20', '50'],
  }));

  const handleTableChange: TableProps['onChange'] = (page, _filters, sorter: any) => {
    const sort = sorter.field && sorter.order
      ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`
      : undefined;
    fetchData({ page: page.current, per_page: page.pageSize, sort: sort, ...searchParams });
  };

  const handleSearch = () => {
    fetchData({ page: 1, per_page: tableData.per_page, ...searchParams });
  };

  const handleReset = () => {
    searchParams.name = undefined;
    handleSearch();
  };

  // --- CRUD 操作 ---
  const handleAddNew = () => {
    currentUnit.value = {};
    modalTitle.value = 'create';
    modalVisible.value = true;
  };

  const handleEdit = (record: UnitRead) => {
    currentUnit.value = { ...record };
    modalTitle.value = 'edit';
    modalVisible.value = true;
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个单位吗？请确保没有菜谱正在使用它。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteUnit(id);
          message.success('删除成功');
          await recipeReferenceStore.fetchAllReferences(true); // 强制刷新 Store 缓存
          handleSearch(); // 刷新表格
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const handleModalOk = async (formData: UnitCreate | UnitUpdate) => {
    modalLoading.value = true;
    try {
      if (modalTitle.value === 'create') {
        await createUnit(formData as UnitCreate);
        message.success('创建成功');
      } else {
        await updateUnit(currentUnit.value.id!, formData as UnitUpdate);
        message.success('更新成功');
      }
      modalVisible.value = false;
      await recipeReferenceStore.fetchAllReferences(true); // 强制刷新 Store 缓存
      handleSearch(); // 刷新表格
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      modalLoading.value = false;
    }
  };

  return {
    loading, tableData, searchParams, pagination,
    modalVisible, modalLoading, modalTitle, currentUnit,
    handleTableChange, handleSearch, handleReset, fetchData: handleSearch,
    handleAddNew, handleEdit, handleDelete, handleModalOk,
  };
}
