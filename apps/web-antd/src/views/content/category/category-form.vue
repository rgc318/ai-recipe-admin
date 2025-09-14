<script lang="ts" setup>
import { reactive, ref, watch, computed } from 'vue';
// [核心修正] 确保从 ant-design-vue 引入了所有需要的组件
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  TreeSelect,
  message
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { pinyin } from 'pinyin-pro';
import { createCategory, updateCategory } from '#/api/content/category';
import type { CategoryRead, CategoryCreate, CategoryUpdate, CategoryReadWithChildren } from './types';
import { useCategoryStore } from '#/store/modules/category';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  categoryData?: CategoryRead | null;
}>();

const formRef = ref<FormInstance>();
const formState = reactive<Partial<CategoryCreate>>({
  name: '',
  slug: '',
  description: null,
  parent_id: null,
});

const rules = {
  name: [{ required: true, message: '请输入分类名称' }],
  slug: [{ required: true, message: '请输入分类别名 (Slug)' }],
};

const categoryStore = useCategoryStore();
const { categoryTree } = storeToRefs(categoryStore);

// 自动填充 slug 的逻辑
watch(() => formState.name, (newName, oldName) => {
  if (!props.categoryData && newName) {
    const currentSlug = formState.slug || '';
    const expectedOldSlug = oldName ? pinyin(oldName, { toneType: 'none', separator: '-' }).toLowerCase() : '';
    if (currentSlug === '' || currentSlug === expectedOldSlug) {
      formState.slug = pinyin(newName, { toneType: 'none', separator: '-' }).toLowerCase();
    }
  }
});

watch(() => props.categoryData, (newData) => {
  if (newData) {
    formState.name = newData.name;
    formState.slug = newData.slug;
    formState.description = newData.description;
    formState.parent_id = newData.parent_id;
  } else {
    formRef.value?.resetFields();
    formState.name = '';
    formState.slug = '';
    formState.description = null;
    formState.parent_id = null;
  }
}, { immediate: true });

// 递归获取一个节点及其所有子孙节点的ID
const getDescendantIds = (node: CategoryReadWithChildren): string[] => {
  return [node.id, ...(node.children || []).flatMap(getDescendantIds)];
};

// 在编辑模式下，过滤掉自身及其所有子孙，防止循环引用
const filteredTreeOptions = computed(() => {
  if (!props.categoryData?.id) {
    categoryStore.fetchCategoryTree(); // 打开时获取最新数据
    return categoryTree.value;
  }
  const selfAndDescendantIds = new Set<string>();
  const findAndGetIds = (nodes: CategoryReadWithChildren[]) => {
    for (const node of nodes) {
      if (node.id === props.categoryData!.id) {
        getDescendantIds(node).forEach(id => selfAndDescendantIds.add(id));
        return;
      }
      if (node.children?.length) findAndGetIds(node.children);
    }
  };
  findAndGetIds(categoryTree.value);

  const filterTree = (nodes: CategoryReadWithChildren[]): CategoryReadWithChildren[] => {
    return nodes
      .filter(node => !selfAndDescendantIds.has(node.id))
      .map(node => ({ ...node, children: filterTree(node.children || []) }));
  };
  categoryStore.fetchCategoryTree(); // 确保数据最新
  return filterTree(categoryTree.value);
});

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const params = { ...formState };
    if (params.parent_id === undefined) params.parent_id = null;

    if (props.categoryData) {
      await updateCategory(props.categoryData.id, params as CategoryUpdate);
      message.success('更新成功');
    } else {
      await createCategory(params as CategoryCreate);
      message.success('新增成功');
    }
    await categoryStore.fetchCategoryTree(true); // 强制刷新分类树缓存
    return true;
  } catch (error) {
    return false;
  }
}

defineExpose({ handleSubmit });
</script>

<template>
  <AForm ref="formRef" :model="formState" :rules="rules" layout="vertical">
    <AFormItem label="分类名称" name="name">
      <AInput v-model:value="formState.name" placeholder="例如：中式菜谱" />
    </AFormItem>
    <AFormItem label="分类别名 (Slug)" name="slug">
      <AInput v-model:value="formState.slug" placeholder="例如：chinese-cuisine" />
    </AFormItem>
    <AFormItem label="父级分类" name="parent_id">
      <TreeSelect
        v-model:value="formState.parent_id"
        :tree-data="filteredTreeOptions"
        :field-names="{ label: 'name', value: 'id', children: 'children' }"
        tree-default-expand-all
        allow-clear
        placeholder="留空则为顶级分类"
        show-search
        tree-node-filter-prop="name"
      />
    </AFormItem>
    <AFormItem label="描述" name="description">
      <AInput.TextArea v-model:value="formState.description" :rows="3" />
    </AFormItem>
  </AForm>
</template>
