<script lang="ts" setup>
import { ref } from 'vue';
import { Button as AButton, Drawer as ADrawer } from 'ant-design-vue';
import TagForm from './tag-form.vue';
import type { TagRead } from './types';

const emit = defineEmits(['success']);

const visible = ref(false);
const title = ref('');
const loading = ref(false);
const formRef = ref<InstanceType<typeof TagForm> | null>(null);
const tagData = ref<TagRead | null>(null);

function open(mode: 'create' | 'update', data?: TagRead) {
  title.value = mode === 'create' ? '新增标签' : '编辑标签';
  tagData.value = data || null;
  visible.value = true;
}

function handleClose() {
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

defineExpose({
  open,
});
</script>

<template>
  <ADrawer v-model:open="visible" :title="title" width="500px" destroy-on-close @close="handleClose">
    <TagForm
      v-if="visible"
      ref="formRef"
      :tag-data="tagData"
    />
    <template #footer>
      <div style="text-align: right">
        <AButton class="mr-2" @click="handleClose">取消</AButton>
        <AButton type="primary" :loading="loading" @click="handleOk">确定</AButton>
      </div>
    </template>
  </ADrawer>
</template>
