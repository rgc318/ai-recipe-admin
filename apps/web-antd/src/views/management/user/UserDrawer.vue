<script lang="ts" setup>
import { ref } from 'vue';
import { Button as AButton, Drawer as ADrawer, message } from 'ant-design-vue';
import UserForm from './user-form.vue';
import { getRolesForSelector } from '#/api/management/users/role'; // 假设你有一个获取所有角色的API

const emit = defineEmits(['success']);

const visible = ref(false);
const title = ref('');
const loading = ref(false);
const formRef = ref();

// --- 新增状态，用于存储角色列表和用户信息 ---
const roleOptions = ref([]); // 存储所有可用的角色选项
const userData = ref(null);   // 存储要编辑的用户数据

/**
 * open 方法现在需要负责获取角色列表
 */
async function open(mode: 'create' | 'update', data?: any) {
  title.value = mode === 'create' ? '新增用户' : '编辑用户';
  userData.value = data || null;

  try {
    // 无论新增还是编辑，都需要获取角色列表来渲染选项
    const responseData = await getRolesForSelector();
    roleOptions.value = responseData || []; // 假设API返回 { items: [...] }
  } catch (error) {
    message.error('加载角色列表失败');
    roleOptions.value = [];
  }

  // 获取完数据后再打开抽屉
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
  <ADrawer
    v-model:open="visible"
    :title="title"
    width="50%"
    destroy-on-close
    @close="handleClose"
  >
    <UserForm ref="formRef" :user-data="userData" :role-options="roleOptions" />

    <template #footer>
      <div style="text-align: right">
        <AButton class="mr-2" @click="handleClose">取消</AButton>
        <AButton type="primary" :loading="loading" @click="handleOk">
          确定
        </AButton>
      </div>
    </template>
  </ADrawer>
</template>
