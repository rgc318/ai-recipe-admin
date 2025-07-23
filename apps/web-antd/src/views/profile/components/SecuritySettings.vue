<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Form, FormItem, InputPassword, Button, Row, Col } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';

const props = defineProps<{ loading: boolean }>();
const emit = defineEmits(['changePassword']);

const formRef = ref<FormInstance>();
const formState = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
});

const validateConfirmPassword = async (_rule: any, value: string) => {
  if (!value) return Promise.reject('请再次输入新密码');
  if (value !== formState.new_password) return Promise.reject('两次输入的新密码不一致!');
  return Promise.resolve();
};

const rules = {
  old_password: [{ required: true, message: '请输入当前密码' }],
  new_password: [{ required: true, message: '请输入新密码' }, { min: 8, message: '密码长度不能少于8位' }],
  confirm_password: [{ validator: validateConfirmPassword, trigger: 'change' }],
};

const onFinish = async () => {
  const success = await emit('changePassword', {
    old_password: formState.old_password,
    new_password: formState.new_password,
  });
  if (success) {
    formRef.value?.resetFields();
  }
};
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-6">安全设置</h2>
    <Row>
      <Col :xs="24" :sm="24" :md="12" :lg="8">
        <Form ref="formRef" :model="formState" :rules="rules" layout="vertical" @finish="onFinish">
          <FormItem label="当前密码" name="old_password">
            <InputPassword v-model:value="formState.old_password" placeholder="请输入当前使用的密码"/>
          </FormItem>
          <FormItem label="新密码" name="new_password">
            <InputPassword v-model:value="formState.new_password" placeholder="请输入8位以上的新密码"/>
          </FormItem>
          <FormItem label="确认新密码" name="confirm_password">
            <InputPassword v-model:value="formState.confirm_password" placeholder="请再次输入新密码"/>
          </FormItem>
          <FormItem>
            <Button type="primary" html-type="submit" :loading="loading">修改密码</Button>
          </FormItem>
        </Form>
      </Col>
    </Row>
  </div>
</template>
