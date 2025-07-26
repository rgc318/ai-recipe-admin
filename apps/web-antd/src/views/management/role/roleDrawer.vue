<script lang="ts" setup>
import { ref } from 'vue';
import { Button as AButton, Drawer as ADrawer, message } from 'ant-design-vue';
import RoleForm from './role-form.vue';
import { getPermissionsForSelector } from '#/api/management/users/permission';

const emit = defineEmits(['success']);

const visible = ref(false);
const title = ref('');
const loading = ref(false);
const formRef = ref();

const permissionOptions = ref([]);
const roleData = ref(null);

async function open(mode: 'create' | 'update', data?: any) {
  title.value = mode === 'create' ? '新增角色' : '编辑角色';
  roleData.value = data || null;

  try {
    loading.value = true;
    // 假设 getPermissionsForSelector 现在直接返回一个数组
    const responseArray = await getPermissionsForSelector();
    // ✅ 代码变得更简洁、更直观
    permissionOptions.value = responseArray || [];
  } catch (error) {
    message.error('加载权限列表失败');
    permissionOptions.value = [];
  } finally {
    loading.value = false;
  }

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
  <ADrawer v-model:open="visible" :title="title" width="50%" destroy-on-close @close="handleClose">
    <RoleForm
      ref="formRef"
      :role-data="roleData"
      :permission-options="permissionOptions"
      :loading="loading"
    />

    <template #footer>
      <div style="text-align: right">
        <AButton class="mr-2" @click="handleClose">取消</AButton>
        <AButton type="primary" :loading="loading" @click="handleOk">确定</AButton>
      </div>
    </template>
  </ADrawer>
</template>
