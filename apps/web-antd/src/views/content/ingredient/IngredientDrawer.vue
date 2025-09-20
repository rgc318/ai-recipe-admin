// 文件位置: src/views/content/ingredient/components/IngredientDrawer.vue

<script lang="ts" setup>
import { ref } from 'vue';
import { Button as AButton, Drawer as ADrawer } from 'ant-design-vue';
import IngredientForm from './IngredientForm.vue'; // <-- 导入我们刚刚创建的表单
import type { IngredientRead } from './types';

const emit = defineEmits(['success']);

const visible = ref(false);
const title = ref('');
const loading = ref(false);
const formRef = ref<InstanceType<typeof IngredientForm> | null>(null);
const ingredientData = ref<IngredientRead | null>(null);

// open 方法，与 TagDrawer 完全一样
function open(mode: 'create' | 'update', data?: IngredientRead) {
  title.value = mode === 'create' ? '新增食材' : '编辑食材';
  ingredientData.value = data || null;
  visible.value = true;
}

function handleClose() {
  visible.value = false;
}

// handleOk 方法，与 TagDrawer 完全一样
async function handleOk() {
  try {
    loading.value = true;
    const success = await formRef.value?.handleSubmit();
    if (success) {
      visible.value = false;
      emit('success'); // 通知父组件刷新列表
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
    <IngredientForm
      v-if="visible"
      ref="formRef"
      :ingredient-data="ingredientData"
    />

    <template #footer>
      <div style="text-align: right">
        <AButton class="mr-2" @click="handleClose">取消</AButton>
        <AButton type="primary" :loading="loading" @click="handleOk">确定</AButton>
      </div>
    </template>
  </ADrawer>
</template>
