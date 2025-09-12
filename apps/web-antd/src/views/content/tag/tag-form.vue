<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { Form as AForm, FormItem as AFormItem, Input as AInput, message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { createTag, updateTag } from '#/api/content/tag'; // 假设你的API文件路径
import type { TagRead, TagCreateData, TagUpdateData } from './types';

const props = defineProps<{
  tagData?: TagRead | null;
}>();

const formRef = ref<FormInstance>();
const formState = reactive({
  name: '',
});

const rules = {
  name: [{ required: true, message: '请输入标签名称' }],
};

watch(
  () => props.tagData,
  (newTag) => {
    if (newTag) {
      formState.name = newTag.name;
    } else {
      formRef.value?.resetFields();
      formState.name = '';
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const params = { ...formState };

    if (props.tagData) {
      await updateTag(props.tagData.id, params as TagUpdateData);
      message.success('更新成功');
    } else {
      await createTag(params as TagCreateData);
      message.success('新增成功');
    }
    return true;
  } catch (error) {
    console.error('表单提交失败:', error);
    return false;
  }
}

defineExpose({
  handleSubmit,
});
</script>

<template>
  <AForm ref="formRef" :model="formState" :rules="rules" layout="vertical">
    <AFormItem label="标签名称" name="name">
      <AInput v-model:value="formState.name" placeholder="请输入标签名称" />
    </AFormItem>
  </AForm>
</template>
