<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Select as ASelect,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { createRole, updateRole } from '#/api/management/role';

const props = defineProps({
  roleData: {
    type: Object,
    default: () => null,
  },
  permissionOptions: {
    type: Array,
    default: () => [],
  },
});

const formRef = ref<FormInstance>();
const formState = reactive({
  name: '',
  code: '',
  description: '',
  permission_ids: [],
});

const rules = {
  name: [{ required: true, message: '请输入角色名称' }],
  code: [{ required: true, message: '请输入角色代码' }],
  permission_ids: [{ required: true, message: '请至少选择一个权限' }],
};

watch(
  () => props.roleData,
  (newRole) => {
    if (newRole) {
      // 编辑模式
      formState.name = newRole.name;
      formState.code = newRole.code;
      formState.description = newRole.description || '';
      formState.permission_ids = newRole.permissions?.map((p: any) => p.id) || [];
    } else {
      // 新增模式
      formRef.value?.resetFields();
      Object.assign(formState, {
        name: '',
        code: '',
        description: '',
        permission_ids: [],
      });
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    const params = { ...formState };

    if (props.roleData) {
      await updateRole(props.roleData.id, params);
      message.success('更新成功');
    } else {
      await createRole(params);
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
    <AFormItem label="角色名称" name="name">
      <AInput v-model:value="formState.name" placeholder="请输入角色名称" />
    </AFormItem>

    <AFormItem label="角色代码" name="code">
      <AInput
        v-model:value="formState.code"
        placeholder="例如：content_editor"
        :disabled="!!props.roleData"
      />
    </AFormItem>

    <AFormItem label="描述" name="description">
      <AInput.TextArea v-model:value="formState.description" placeholder="请输入角色描述" />
    </AFormItem>

    <AFormItem label="关联权限" name="permission_ids">
      <ASelect
        v-model:value="formState.permission_ids"
        mode="multiple"
        placeholder="请选择要关联的权限"
        :options="permissionOptions"
        :field-names="{ label: 'name', value: 'id' }"
        option-filter-prop="name"
        max-tag-count="responsive"
      />
    </AFormItem>
  </AForm>
</template>
