<script lang="ts" setup>
import {ref, watch, onMounted, computed} from 'vue';
import { Form, FormItem, Input, TreeSelect, Modal } from 'ant-design-vue';

import type { CategoryCreate, CategoryUpdate, CategoryRead, CategoryReadWithChildren } from './types';
import { pinyin } from 'pinyin-pro';
import {useCategoryStore} from "#/store/modules/category";
import {storeToRefs} from "pinia";
const props = defineProps<{
  visible: boolean;
  loading: boolean;
  title: 'create' | 'edit';
  categoryData?: Partial<CategoryRead>;
}>();

const emit = defineEmits(['update:visible', 'ok']);

const formRef = ref();
const formState = ref<Partial<CategoryCreate | CategoryUpdate>>({});

const categoryStore = useCategoryStore();
const { categoryTree: categoryTreeOptions } = storeToRefs(categoryStore); // 响应式地引用数据



// 递归获取一个节点及其所有子孙节点的ID
function getDescendantIds(node: CategoryReadWithChildren): string[] {
  let ids = [node.id];
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      ids = ids.concat(getDescendantIds(child));
    });
  }
  return ids;
}

// 【新增】使用计算属性来生成最终的、经过过滤的选项
const finalTreeOptions = computed(() => {
  if (props.title === 'create' || !props.categoryData?.id) {
    return categoryTreeOptions.value; // 新增模式下，显示所有
  }

  // 编辑模式下，获取当前分类及其所有子孙的ID
  const selfAndDescendantIds = new Set<string>();
  const findNode = (nodes: CategoryReadWithChildren[]) => {
    for (const node of nodes) {
      if (node.id === props.categoryData.id) {
        getDescendantIds(node).forEach(id => selfAndDescendantIds.add(id));
        return;
      }
      if (node.children && node.children.length > 0) {
        findNode(node.children);
      }
    }
  };
  findNode(categoryTreeOptions.value);

  // 递归过滤掉这些ID
  const filterTree = (nodes: CategoryReadWithChildren[]): CategoryReadWithChildren[] => {
    return nodes
      .filter(node => !selfAndDescendantIds.has(node.id))
      .map(node => ({
        ...node,
        children: node.children ? filterTree(node.children) : [],
      }));
  };

  return filterTree(categoryTreeOptions.value);
});


watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // 弹窗打开时，第一次获取数据
    categoryStore.fetchCategoryTree(); // 调用 action，它内部会处理缓存
    formState.value = { ...props.categoryData };
  } else {
    formRef.value?.resetFields();
  }
});
// 2. 监听 name 字段的变化
watch(
  () => formState.value.name,
  (newName, oldName) => {
    // 仅在“新增模式”下，并且有新名称时才处理
    if (props.title !== 'create' || !newName) {
      return;
    }

    const currentSlug = formState.value.slug || '';

    // 生成旧名称对应的 slug，用于对比
    const expectedOldSlug = oldName
      ? pinyin(oldName, { toneType: 'none', separator: '-' }).toLowerCase()
      : '';

    // 【核心逻辑】
    // 如果当前的 slug 是空的，或者它正好等于根据旧名称生成的 slug，
    // 就说明用户没有手动改过它，我们就可以安全地用新名称生成的新 slug 覆盖它。
    if (currentSlug === '' || currentSlug === expectedOldSlug) {
      formState.value.slug = pinyin(newName, { toneType: 'none', separator: '-' }).toLowerCase();
    }
  },
);


const handleOk = async () => {
  try {
    const values = await formRef.value.validate();
    emit('ok', values);
  } catch (errorInfo) {
    console.log('表单验证失败:', errorInfo);
  }
};

const handleCancel = () => {
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :title="title === 'create' ? '新增分类' : '编辑分类'"
    :open="visible"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form ref="formRef" :model="formState" layout="vertical" class="mt-4">
      <FormItem label="分类名称" name="name" :rules="[{ required: true, message: '请输入分类名称' }]">
        <Input v-model:value="formState.name" placeholder="例如：中式菜谱" />
      </FormItem>
      <FormItem label="分类别名 (Slug)" name="slug" :rules="[{ required: true, message: '请输入分类别名' }]">
        <Input v-model:value="formState.slug" placeholder="例如：chinese-cuisine" />
      </FormItem>
      <FormItem label="父级分类" name="parent_id">
        <TreeSelect
          v-model:value="formState.parent_id"
          :tree-data="finalTreeOptions"
          :field-names="{ label: 'name', value: 'id', children: 'children' }"
          tree-default-expand-all
          allow-clear
          placeholder="留空则为顶级分类"

          show-search
          tree-node-filter-prop="name"
        />
      </FormItem>
      <FormItem label="描述" name="description">
        <Input.TextArea v-model:value="formState.description" :rows="3" />
      </FormItem>
    </Form>
  </Modal>
</template>
