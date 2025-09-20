// 文件位置: src/views/content/ingredient/components/IngredientForm.vue

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { Form as AForm, FormItem as AFormItem, Input as AInput, message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';

// [核心] 导入 Ingredient 相关的 API 和类型
import { createIngredient, updateIngredient } from '#/api/content/ingredient';
import type { IngredientRead, IngredientCreateData, IngredientUpdateData } from './types';

const props = defineProps<{
  // [核心] Prop 名称和类型已更新
  ingredientData?: IngredientRead | null;
}>();

const formRef = ref<FormInstance>();

// [核心] 表单状态包含了食材的所有可编辑字段
const formState = reactive({
  name: '',
  description: '',
  plural_name: '',
});

const rules = {
  name: [{ required: true, message: '请输入食材名称' }],
};

// [核心] watch 侦听器现在会填充所有食材字段
watch(
  () => props.ingredientData,
  (newIngredient) => {
    if (newIngredient) {
      // 编辑模式：填充数据
      formState.name = newIngredient.name;
      formState.description = newIngredient.description || '';
      formState.plural_name = newIngredient.plural_name || '';
    } else {
      // 新增模式：重置表单
      formRef.value?.resetFields();
      formState.name = '';
      formState.description = '';
      formState.plural_name = '';
    }
  },
  { immediate: true },
);

// [核心] handleSubmit 的逻辑结构不变，只是调用的API和参数不同
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const params = { ...formState };

    if (props.ingredientData) {
      await updateIngredient(props.ingredientData.id, params as IngredientUpdateData);
      message.success('更新成功');
    } else {
      await createIngredient(params as IngredientCreateData);
      message.success('新增成功');
    }
    return true; // 返回 true 表示成功
  } catch (error) {
    console.error('表单提交失败:', error);
    return false; // 返回 false 表示失败
  }
}

defineExpose({
  handleSubmit,
});
</script>

<template>
  <AForm ref="formRef" :model="formState" :rules="rules" layout="vertical">
    <AFormItem label="食材名称" name="name">
      <AInput v-model:value="formState.name" placeholder="请输入食材名称，如：鸡胸肉" />
    </AFormItem>
    <AFormItem label="复数形式 (可选)" name="plural_name">
      <AInput v-model:value="formState.plural_name" placeholder="例如：egg -> eggs" />
    </AFormItem>
    <AFormItem label="描述 (可选)" name="description">
      <AInput.TextArea v-model:value="formState.description" :rows="4" placeholder="对食材的简单描述" />
    </AFormItem>
  </AForm>
</template>
