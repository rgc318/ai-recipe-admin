<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { Form as AForm, FormItem as AFormItem, Input as AInput, message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { createUnit, updateUnit } from '#/api/content/unit';
import type { UnitRead, UnitCreateData, UnitUpdateData } from './types';

const props = defineProps<{
  unitData?: UnitRead | null;
}>();

const formRef = ref<FormInstance>();
const formState = reactive<UnitCreateData>({
  name: '',
  abbreviation: null,
  plural_name: null,
});

const rules = {
  name: [{ required: true, message: '请输入单位名称' }],
};

// 监听传入的数据，如果是编辑模式，则填充表单
watch(
  () => props.unitData,
  (newUnit) => {
    if (newUnit) {
      formState.name = newUnit.name;
      formState.abbreviation = newUnit.abbreviation;
      formState.plural_name = newUnit.plural_name;
    } else {
      // 如果是新增模式，重置表单
      formRef.value?.resetFields();
      formState.name = '';
      formState.abbreviation = null;
      formState.plural_name = null;
    }
  },
  { immediate: true },
);

// 核心的提交逻辑，由父组件 unitDrawer.vue 调用
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const params = { ...formState };

    if (props.unitData) {
      // 更新模式
      await updateUnit(props.unitData.id, params as UnitUpdateData);
      message.success('更新成功');
    } else {
      // 创建模式
      await createUnit(params as UnitCreateData);
      message.success('新增成功');
    }
    return true; // 返回 true 表示成功
  } catch (error) {
    // API请求的全局错误拦截器通常会处理错误消息
    return false; // 返回 false 表示失败
  }
}

// 通过 defineExpose 将 handleSubmit 方法暴露给父组件
defineExpose({
  handleSubmit,
});
</script>

<template>
  <AForm ref="formRef" :model="formState" :rules="rules" layout="vertical">
    <AFormItem label="单位名称" name="name">
      <AInput v-model:value="formState.name" placeholder="请输入单位名称 (如: 克)" />
    </AFormItem>
    <AFormItem label="缩写 (可选)" name="abbreviation">
      <AInput v-model:value="formState.abbreviation" placeholder="请输入缩写 (如: g)" />
    </AFormItem>
    <AFormItem label="复数名称 (可选)" name="plural_name">
      <AInput v-model:value="formState.plural_name" placeholder="请输入复数名称 (如: cups)" />
    </AFormItem>
  </AForm>
</template>
