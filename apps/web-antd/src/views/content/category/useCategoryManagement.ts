import { ref, computed, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { createCategory, updateCategory, deleteCategory } from '#/api/management/category';
import type { CategoryRead, CategoryCreate, CategoryUpdate, CategoryReadWithChildren } from './types';
import { useCategoryStore } from '#/store/modules/category';

export function useCategoryManagement() {
  const loading = ref(false);
  const treeData = ref<CategoryReadWithChildren[]>([]);
  const searchText = ref('');

  // 【核心】回归到一个简单的 ref 来管理展开状态，这是唯一的数据源
  const expandedKeys = ref<string[]>([]);

  const modalVisible = ref(false);
  const modalLoading = ref(false);
  const modalTitle = ref<'create' | 'edit'>('create');
  const currentCategory = ref<Partial<CategoryRead>>({});
  const categoryStore = useCategoryStore();

  const handleReset = () => {
    searchText.value = '';
  };
  async function fetchTreeData() {
    loading.value = true;
    try {
      await categoryStore.fetchCategoryTree(true);
      treeData.value = categoryStore.categoryTree;
      // 数据加载后，默认只展开顶级节点
      expandedKeys.value = treeData.value.map(item => item.id);
    } catch (error) {
      message.error('获取分类树失败');
      treeData.value = [];
    } finally {
      loading.value = false;
    }
  }

  // 计算属性现在只负责“过滤”数据
  const filteredTreeData = computed(() => {
    const query = searchText.value.trim().toLowerCase();
    if (!query) {
      return treeData.value;
    }

    // 【重要】这个递归算法确保了匹配项的子树被完整保留
    function filter(nodes: CategoryReadWithChildren[]): CategoryReadWithChildren[] {
      const result: CategoryReadWithChildren[] = [];
      for (const node of nodes) {
        const isMatch = node.name.toLowerCase().includes(query);
        const filteredChildren = filter(node.children || []);

        if (isMatch || filteredChildren.length > 0) {
          result.push({
            ...node,
            // 如果节点自身匹配，则保留其所有原始子节点，使其可展开
            // 否则，使用过滤后的子节点列表
            children: isMatch ? (node.children || []) : filteredChildren,
          });
        }
      }
      return result;
    }
    return filter(treeData.value);
  });

  // watch 监听器现在只负责在搜索时“自动展开”，即更新 expandedKeys 的值
  watch(searchText, (query) => {
    if (!query.trim()) {
      // 搜索清空时，恢复默认只展开顶级
      expandedKeys.value = treeData.value.map(item => item.id);
      return;
    }

    const newExpandedKeys = new Set<string>();
    const queryLower = query.trim().toLowerCase();

    // 递归函数，用于查找并收集匹配节点的【所有父级ID】
    function findAndCollectParents(nodes: CategoryReadWithChildren[], parents: string[] = []) {
      for (const node of nodes) {
        if (node.name.toLowerCase().includes(queryLower)) {
          parents.forEach(pId => newExpandedKeys.add(pId));
        }
        if (node.children && node.children.length > 0) {
          findAndCollectParents(node.children, [...parents, node.id]);
        }
      }
    }

    findAndCollectParents(treeData.value);
    expandedKeys.value = Array.from(newExpandedKeys);
  });

  // --- CRUD 操作 (保持不变，但刷新逻辑现在更可靠) ---
  const handleAddNew = () => {
    currentCategory.value = {};
    modalTitle.value = 'create';
    modalVisible.value = true;
  };

  const handleAddChild = (parent: CategoryRead) => {
    currentCategory.value = { parent_id: parent.id };
    modalTitle.value = 'create';
    modalVisible.value = true;
  };

  const handleEdit = (record: CategoryRead) => {
    currentCategory.value = { ...record };
    modalTitle.value = 'edit';
    modalVisible.value = true;
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个分类吗？其所有子分类也会被一并删除。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCategory(id);
          message.success('删除成功');
          await fetchTreeData(); // 刷新整棵树
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleModalOk = async (formData: CategoryCreate | CategoryUpdate) => {
    modalLoading.value = true;
    try {
      const payload = { ...formData };
      if (payload.parent_id === undefined) {
        payload.parent_id = null;
      }
      if (modalTitle.value === 'create') {
        await createCategory(payload as CategoryCreate);
        message.success('创建成功');
      } else {
        await updateCategory(currentCategory.value.id!, payload as CategoryUpdate);
        message.success('更新成功');
      }
      modalVisible.value = false;
      await fetchTreeData(); // 刷新整棵树
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      modalLoading.value = false;
    }
  };

  return {
    loading,
    searchText,
    filteredTreeData,
    expandedKeys, // <-- 直接暴露简单的 ref
    handleReset, // <-- 直接暴露简单的 ref
    modalVisible, modalLoading, modalTitle, currentCategory,
    fetchData: fetchTreeData,
    handleAddNew, handleAddChild, handleEdit, handleDelete, handleModalOk,
    // 负责接收用户手动点击展开/关闭的事件
    onExpandedKeysChange: (keys: string[]) => { expandedKeys.value = keys; },
  };
}
