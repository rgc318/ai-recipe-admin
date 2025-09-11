<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Form, FormItem, Input, Modal } from 'ant-design-vue';
import type { UnitCreate, UnitUpdate, UnitRead } from './types';

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  title: 'create' | 'edit';
  unitData?: Partial<UnitRead>;
}>();

const emit = defineEmits(['update:visible', 'ok']);

const formRef = ref();
const formState = ref<Partial<UnitCreate | UnitUpdate>>({});

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    formState.value = { ...props.unitData };
  } else {
    formRef.value?.resetFields();
  }
});

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
    :title="title === 'create' ? '新增单位' : '编辑单位'"
    :open="visible"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form ref="formRef" :model="formState" layout="vertical" class="mt-4">
      <FormItem label="单位名称" name="name" :rules="[{ required: true, message: '请输入单位名称' }]">
        <Input v-model:value="formState.name" placeholder="例如：克" />
      </FormItem>
      <FormItem label="缩写" name="abbreviation">
        <Input v-model:value="formState.abbreviation" placeholder="例如：g" />
      </FormItem>
      <FormItem label="复数名称" name="plural_name">
        <Input v-model:value="formState.plural_name" placeholder="例如：cups (用于国际化)" />
      </FormItem>
    </Form>
  </Modal>
</template>
