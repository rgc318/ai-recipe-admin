<script lang="ts" setup>
import { reactive, watch, ref, h } from 'vue';
import { Form, FormItem, Input, Select, TreeSelect, Upload, Avatar, message, Button } from 'ant-design-vue';
import { UploadOutlined, PictureOutlined } from '@ant-design/icons-vue';
import { storeToRefs } from 'pinia';
import { debounce } from 'lodash-es';

import { useRecipeReferenceStore } from '#/store/modules/recipeReference';
import { searchTags } from '#/api/recipes/tag';
import type { TagRead } from '../types';

// --- 组件通信: v-model ---
const props = defineProps<{
  modelValue: { [key: string]: any };
}>();
const emit = defineEmits(['update:modelValue']);

// --- 内部状态 ---
const formState = reactive({
  title: '',
  description: '',
  cover_image_url: null,
  category_id: null,
  tags: [] as (string | { value: string; label: string })[], // 明确类型以获得更好的TS支持
});

const tagOptions = ref<TagRead[]>([]);
const tagSearching = ref(false);

const referenceStore = useRecipeReferenceStore();
const { categoriesForSelector } = storeToRefs(referenceStore);

// --- 核心逻辑 ---

// 当父组件传入数据时，同步到内部状态
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      formState.title = newValue.title || '';
      formState.description = newValue.description || '';
      formState.cover_image_url = newValue.cover_image_url || null;
      formState.category_id = newValue.category?.id || null;
      // 在编辑模式下，将后端的 tags 对象数组转换为 Ant Design Select 需要的 value 数组 (UUIDs)
      formState.tags = (newValue.tags || []).map((tag: TagRead) => tag.id);
    }
  },
  { immediate: true, deep: true },
);

// =================================================================
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 核心修正点 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 1. 移除导致无限循环的 watch 函数
/*
watch(formState, (newFormState) => {
  emit('update:modelValue', newFormState);
});
*/

// 2. 新增一个处理函数，当用户操作表单时，由它来通知父组件
function onFormChange() {
  // 我们直接 emit 整个 formState 对象
  emit('update:modelValue', formState);
}
// =================================================================

// 标签远程搜索 (带防抖)
const handleTagSearch = debounce(async (query: string) => {
  if (!query) {
    tagOptions.value = [];
    return;
  }
  tagSearching.value = true;
  try {
    const response = await searchTags({ name: query });
    // 将返回的 TagRead[] 转换为 Select 组件需要的 {label, value} 格式
    tagOptions.value = response.items.map(tag => ({
      id: tag.id, // 保留原始id
      name: tag.name,
    }));
  } catch (error) {
    message.error('搜索标签失败');
  } finally {
    tagSearching.value = false;
  }
}, 300);

// 模拟封面上传
function handleCoverUpload(info: any) {
  if (info.file.status === 'done') {
    formState.cover_image_url = info.file.response.url;
    message.success('封面上传成功');
    onFormChange(); // 【重要】上传成功后也通知父组件
  } else if (info.file.status === 'error') {
    message.error('封面上传失败');
  }
}
</script>

<template>
  <Form :model="formState" layout="vertical">
    <FormItem label="菜谱标题" name="title" :rules="[{ required: true, message: '请输入菜谱标题' }]">
      <Input v-model:value="formState.title" placeholder="给你的菜谱起个吸引人的名字吧" @change="onFormChange" />
    </FormItem>

    <FormItem label="菜谱描述" name="description">
      <Input.TextArea
        v-model:value="formState.description"
        :rows="4"
        placeholder="简单介绍一下这道菜的特色和故事..."
        @change="onFormChange"
      />
    </FormItem>

    <FormItem label="封面图片" name="cover_image_url">
      <div class="flex items-center gap-4">
        <Avatar :size="128" shape="square" :src="formState.cover_image_url">
          <template #icon><PictureOutlined /></template>
        </Avatar>
        <Upload
          name="cover"
          :show-upload-list="false"
          action="/api/v1/files/upload"
          @change="handleCoverUpload"
        >
          <Button :icon="h(UploadOutlined)">
            {{ formState.cover_image_url ? '更换封面' : '上传封面' }}
          </Button>
        </Upload>
      </div>
    </FormItem>

    <FormItem label="分类" name="category_id">
      <TreeSelect
        v-model:value="formState.category_id"
        :tree-data="categoriesForSelector"
        placeholder="为菜谱选择一个分类"
        tree-default-expand-all
        allow-clear
        @change="onFormChange"
      />
    </FormItem>

    <FormItem label="标签" name="tags">
      <Select
        v-model:value="formState.tags"
        mode="tags"
        placeholder="输入或搜索标签，按回车创建新标签"
        :options="tagOptions"
        :field-names="{ label: 'name', value: 'id' }"
        :filter-option="false"
        :loading="tagSearching"
        @search="handleTagSearch"
        @change="onFormChange"
      />
    </FormItem>
  </Form>
</template>
