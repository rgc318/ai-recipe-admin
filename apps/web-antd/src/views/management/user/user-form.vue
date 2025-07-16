<script lang="ts" setup>
// 2. 引入你的类型定义
import type { UserItem } from './types';

import { reactive, ref, watch } from 'vue';

// 1. 直接从 ant-design-vue 引入我们将要使用的原生表单组件
import { Form, FormItem, Input, message, Select } from 'ant-design-vue';

// --- Props & Emits ---
const props = defineProps<{
  // 接收从父组件传来的用户信息，用于编辑
  userData: null | Partial<UserItem>;
}>();

const emit = defineEmits<{
  // 提交成功后，通知父组件刷新列表
  (e: 'success'): void;
}>();

// --- 表单逻辑 ---
const formRef = ref(); // antd 表单的引用
const formState = reactive<Partial<UserItem>>({
  id: undefined,
  username: '',
  email: '',
  role: undefined,
  status: 'active',
});

// 表单验证规则
const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ],
  status: [{ required: true, message: '请选择状态' }],
};

// --- 监听外部传入的数据变化 ---
watch(
  () => props.userData,
  (newUser) => {
    // 当父组件传来新的 userData 时（比如点击编辑），用新数据填充表单
    // 如果是新增，userData 为 null，则重置表单
    if (newUser && newUser.id) {
      Object.assign(formState, newUser);
    } else {
      // 重置表单到初始状态
      formRef.value?.resetFields();
      Object.assign(formState, {
        id: undefined,
        username: '',
        email: '',
        role: undefined,
        status: 'active',
      });
    }
  },
  { deep: true },
);

// --- 提交逻辑 ---
async function handleSubmit() {
  try {
    await formRef.value.validate();
    // 这里是调用真实的新增或更新 API 的地方
    // const api = formState.id ? updateUser : createUser;
    // await api(formState);

    console.log('提交的表单数据:', formState);
    message.success(formState.id ? '更新成功' : '新增成功');
    emit('success'); // 通知父组件成功了
    return true; // 返回 true，让抽屉组件知道可以关闭了
  } catch {
    message.error('操作失败');
    return false; // 返回 false，操作失败不关闭抽屉
  }
}

// 通过 defineExpose 将提交方法暴露给父组件（抽屉组件）
// 这样父组件的“确定”按钮才能调用到这个方法
defineExpose({
  handleSubmit,
});
</script>

<template>
  <Form ref="formRef" :model="formState" :rules="rules" layout="vertical">
    <FormItem label="用户名" name="username">
      <Input v-model:value="formState.username" placeholder="请输入用户名" />
    </FormItem>
    <FormItem label="邮箱" name="email">
      <Input v-model:value="formState.email" placeholder="请输入邮箱" />
    </FormItem>
    <FormItem label="角色" name="role">
      <Select v-model:value="formState.role" placeholder="请选择角色">
        <Select.Option value="admin">管理员</Select.Option>
        <Select.Option value="operator">运营人员</Select.Option>
        <Select.Option value="user">普通用户</Select.Option>
      </Select>
    </FormItem>
    <FormItem label="状态" name="status">
      <Select v-model:value="formState.status" placeholder="请选择状态">
        <Select.Option value="active">启用</Select.Option>
        <Select.Option value="inactive">禁用</Select.Option>
      </Select>
    </FormItem>
  </Form>
</template>
