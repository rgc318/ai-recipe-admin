<script lang="ts" setup>
import { ref } from 'vue';
import { Modal as AModal } from 'ant-design-vue';
import CategoryForm from './category-form.vue';
import type { CategoryRead } from './types';

const emit = defineEmits(['success']);

const visible = ref(false);
const title = ref('');
const loading = ref(false);
const formRef = ref<InstanceType<typeof CategoryForm> | null>(null);
const categoryData = ref<CategoryRead | null>(null);

function open(mode: 'create' | 'update', data?: CategoryRead) {
  title.value = mode === 'create' ? '新增分类' : '编辑分类';
  categoryData.value = data || null;
  visible.value = true;
}

function handleCancel() {
  visible.value = false;
}

async function handleOk() {
  try {
    loading.value = true;
    const success = await formRef.value?.handleSubmit();
    if (success) {
      visible.value = false;
      emit('success');
    }
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <AModal
    v-model:open="visible"
    :title="title"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
    :confirm-loading="loading"
  >
    <CategoryForm
      v-if="visible"
      ref="formRef"
      :category-data="categoryData"
    />
  </AModal>
</template>
