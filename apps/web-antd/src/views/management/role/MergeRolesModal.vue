<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { debounce } from 'lodash-es';
import {
  Modal as AModal, Form as AForm, FormItem as AFormItem, Select as ASelect,
  message, Tag as ATag, RadioGroup as ARadioGroup, RadioButton as ARadioButton
} from 'ant-design-vue';
import { mergeRoles, getRolesForSelector } from '#/api/management/users/role';
import type { RoleReadWithPermissions, RoleMergePayload } from './types';

const emit = defineEmits(['success']);

const visible = ref(false);
const loading = ref(false);
const searching = ref(false);
const formState = reactive<RoleMergePayload>({
  source_role_ids: [],
  destination_role_id: '',
});

const contextRoles = ref<RoleReadWithPermissions[]>([]);
const isContextMode = computed(() => contextRoles.value.length > 0);

const sourceRoleOptions = ref<{ label: string; value: string }[]>([]);
const targetRoleOptions = ref<{ label: string; value: string }[]>([]);

const open = (selectedRoles?: RoleReadWithPermissions[]) => {
  resetFormState();
  if (selectedRoles && selectedRoles.length >= 2) {
    // 上下文模式
    contextRoles.value = selectedRoles;
    targetRoleOptions.value = selectedRoles.map(r => ({ label: r.name, value: r.id }));
  } else {
    // 全局模式
    contextRoles.value = [];
  }
  visible.value = true;
};

const resetFormState = () => {
  formState.source_role_ids = [];
  formState.destination_role_id = '';
  sourceRoleOptions.value = [];
  targetRoleOptions.value = [];
  contextRoles.value = [];
};

const handleOk = async () => {
  let finalPayload: RoleMergePayload;

  if (isContextMode.value) {
    if (!formState.destination_role_id) {
      message.warning('请从已选角色中指定一个作为目标');
      return;
    }
    const sourceIds = contextRoles.value
      .map(r => r.id)
      .filter(id => id !== formState.destination_role_id);
    finalPayload = { source_role_ids: sourceIds, destination_role_id: formState.destination_role_id };
  } else {
    if (!formState.destination_role_id || formState.source_role_ids.length === 0) {
      message.warning('请选择源角色和目标角色');
      return;
    }
    finalPayload = { ...formState };
  }

  loading.value = true;
  try {
    await mergeRoles(finalPayload);
    message.success('合并成功');
    emit('success');
    visible.value = false;
  } finally {
    loading.value = false;
  }
};

const handleRemoteSearch = debounce(async (query: string, type: 'source' | 'target') => {
  if (!query) return;
  searching.value = true;
  try {
    // 假设 getRolesForSelector 支持按 name 搜索
    const roles = await getRolesForSelector({ name: query });
    const options = roles.map(r => ({ label: r.name, value: r.id }));
    if (type === 'source') {
      sourceRoleOptions.value = options;
    } else {
      targetRoleOptions.value = options;
    }
  } finally {
    searching.value = false;
  }
}, 300);

defineExpose({ open });
</script>

<template>
  <AModal v-model:open="visible" title="合并角色" @ok="handleOk" :confirm-loading="loading">
    <p class="text-gray-500 mb-4">将一个或多个“源角色”合并入一个“目标角色”。操作后，源角色将被删除，其关联的用户和权限将全部转移到目标角色下。</p>

    <AForm v-if="isContextMode" layout="vertical">
      <AFormItem label="请从下列角色中选择一个作为“目标”（将保留）">
        <ARadioGroup v-model:value="formState.destination_role_id" button-style="solid">
          <ARadioButton v-for="role in contextRoles" :key="role.id" :value="role.id" class="m-1">
            {{ role.name }}
          </ARadioButton>
        </ARadioGroup>
      </AFormItem>
      <AFormItem v-if="formState.destination_role_id" label="以下角色将被“合并并删除”">
        <div class="flex flex-wrap gap-1">
          <ATag color="warning" v-for="role in contextRoles.filter(r => r.id !== formState.destination_role_id)" :key="role.id">
            {{ role.name }}
          </ATag>
        </div>
      </AFormItem>
    </AForm>

    <AForm v-else layout="vertical">
      <AFormItem label="源角色 (将被合并并删除)">
        <ASelect v-model:value="formState.source_role_ids" mode="multiple" placeholder="搜索要合并的角色" :options="sourceRoleOptions" :loading="searching" show-search :filter-option="false" @search="(q) => handleRemoteSearch(q, 'source')" allow-clear />
      </AFormItem>
      <AFormItem label="目标角色 (将保留)">
        <ASelect v-model:value="formState.destination_role_id" placeholder="搜索要保留的目标角色" :options="targetRoleOptions" :loading="searching" show-search :filter-option="false" @search="(q) => handleRemoteSearch(q, 'target')" allow-clear />
      </AFormItem>
    </AForm>
  </AModal>
</template>
