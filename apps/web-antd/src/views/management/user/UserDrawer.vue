<script lang="ts" setup>
import type { UserItem } from './types';

import { ref } from 'vue';

// 1. 引入 antd 的原生抽屉组件
import { Button as AButton, Drawer as ADrawer } from 'ant-design-vue';

// 2. 引入我们已经重写好的用户表单组件
import UserForm from './user-form.vue';

const emit = defineEmits(['success']);

// --- 抽屉自身的状态管理 ---
const visible = ref(false); // 控制抽屉的显示/隐藏
const title = ref(''); // 抽屉的标题
const loading = ref(false); // 控制“确定”按钮的加载状态

// --- 与子组件（表单）的交互 ---
const formRef = ref(); // 获取 UserForm 组件的实例
const userData = ref<null | Partial<UserItem>>(null); // 传递给表单的数据

/**
 * @description: 父组件（index.vue）通过这个方法来打开抽屉
 * @param {'create' | 'update'} mode - 模式：新增或编辑
 * @param {UserItem} [data] - 编辑时传入的用户数据
 */
function open(mode: 'create' | 'update', data?: UserItem) {
  title.value = mode === 'create' ? '新增用户' : '编辑用户';
  // 将数据传递给表单组件
  userData.value = data || null;
  // 打开抽屉
  visible.value = true;
}

// --- 抽屉事件处理 ---
function handleClose() {
  visible.value = false;
}

async function handleOk() {
  try {
    loading.value = true;
    // 调用子组件（UserForm）暴露出来的 handleSubmit 方法
    const success = await formRef.value?.handleSubmit();
    // 如果表单提交成功，则关闭抽屉
    if (success) {
      visible.value = false;
      // 并通知父组件（index.vue）刷新列表
      emit('success');
    }
  } finally {
    loading.value = false;
  }
}

// 3. 通过 defineExpose 将 open 方法暴露出去，让父组件可以调用
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
    <UserForm ref="formRef" :user-data="userData" />

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
