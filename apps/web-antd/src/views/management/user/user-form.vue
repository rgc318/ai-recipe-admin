<script lang="ts" setup>
import {computed, reactive, ref, watch} from 'vue';
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Select as ASelect,
  Switch as ASwitch,
  Upload as AUpload, // 【新增】导入Upload组件
  Avatar as AAvatar,   // 【新增】导入Avatar组件
  message,
} from 'ant-design-vue';
import type { FormInstance, UploadProps } from 'ant-design-vue';
import { UserOutlined, UploadOutlined } from '@ant-design/icons-vue'; // 【新增】导入图标
// 【新增】导入新的API方法
import {
  // 【移除】这个是旧的、将被废弃的直传接口
  // adminUpdateUserAvatar,

  // 【新增】为管理员场景新增的两个预签名流程接口
  adminGenerateAvatarUploadPolicy,
  adminLinkUploadedAvatar,

  createUser,
  updateUser,
} from '#/api/management/users/user';

import {
  generatePresignedUploadPolicy,     // 新增时使用
  registerFile,                        // 新增时使用
} from '#/api/management/files/file';

import { useUploader } from '#/hooks/web/useUploader';
import type { FileRecordRead } from '#/views/management/files/types'

// 【新增】还需要一个 axios 实例来执行物理上传
import axios from 'axios';

// --- 组件通信 (Props & Emits) ---
const props = defineProps({
  userData: {
    type: Object,
    default: () => null,
  },
  roleOptions: {
    type: Array,
    default: () => [],
  },
});


// --- 3. 为不同场景分别准备上传工具 ---
// 场景一：“创建用户”时，使用通用的 uploader hook

// --- 2. 准备加载状态 ---
const isUploading = ref(false);

// --- 3. 表单状态与规则 ---
const formRef = ref<FormInstance>();
const formState = reactive({
  username: '',
  password: '',
  full_name: '',
  email: '',
  phone: '',
  is_active: true,
  is_superuser: false,
  role_ids: [] as string[],
  avatar_url: '', // 用于UI预览
  avatar_file_record_id: null as string | null, // 用于“新增”模式
});

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: !props.userData, message: '请输入密码' }],
  role_ids: [{ required: true, message: '请至少选择一个角色' }],
};

// --- 4. 侦听器，用于填充/重置表单 ---
watch(
  () => props.userData,
  (newUser) => {
    if (newUser) {
      // 编辑模式
      formState.avatar_url = newUser.full_avatar_url || '';
      formState.username = newUser.username;
      formState.full_name = newUser.full_name || '';
      formState.email = newUser.email || '';
      formState.phone = newUser.phone || '';
      formState.is_active = newUser.is_active;
      formState.is_superuser = newUser.is_superuser;
      formState.role_ids = newUser.roles?.map((role) => role.id) || [];
      formState.password = '';
      formState.avatar_file_record_id = null;
    } else {
      // 新增模式
      formRef.value?.resetFields();
      Object.assign(formState, {
        username: '', password: '', full_name: '', email: '', phone: '',
        is_active: true, is_superuser: false, role_ids: [],
        avatar_url: '', avatar_file_record_id: null,
      });
    }
  },
  { immediate: true, deep: true },
);

// --- 5. 【核心】统一的上传请求调度员 ---
const customRequest = async ({ file, onSuccess, onError, onProgress }: any) => {
  isUploading.value = true;
  try {
    let policy: any;
    // --- 步骤 A: 根据模式，调用不同的策略生成接口 ---
    if (props.userData) {
      // 更新模式：调用管理员专用接口
      const policyRes = await adminGenerateAvatarUploadPolicy(props.userData.id, {
        original_filename: file.name,
        content_type: file.type,
      });
      policy = policyRes;
    } else {
      // 新增模式：调用通用接口
      const policyRes = await generatePresignedUploadPolicy({
        original_filename: file.name,
        content_type: file.type,
        profile_name: 'general_files', // 明确指定 Profile
      });
      policy = policyRes;
    }

    // --- 步骤 B: 物理上传文件到云 (通用逻辑) ---
    const formData = new FormData();
    Object.keys(policy.fields).forEach((key) => formData.append(key, policy.fields[key]));
    formData.append('file', file);
    await axios.post(policy.url, formData, {
      onUploadProgress: (event) => {
        if (event.total) onProgress({ percent: Math.round((event.loaded * 100) / event.total) });
      },
    });

    // --- 步骤 C: 根据模式，执行不同的后续操作 ---
    if (props.userData) {
      // 更新模式：立即调用关联接口
      const linkRes = await adminLinkUploadedAvatar(props.userData.id, {
        object_name: policy.object_name,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
      });
      formState.avatar_url = linkRes.full_avatar_url || '';
      message.success('头像更新成功！');
      onSuccess(linkRes);
    } else {
      // 新增模式：只登记文件，并暂存ID
      const registerRes = await registerFile({
        object_name: policy.object_name,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        profile_name: 'user_avatars',
      });
      formState.avatar_file_record_id = registerRes.id;
      formState.avatar_url = registerRes.url || '';
      message.success('头像已上传并准备就绪');
      onSuccess(registerRes);
    }
  } catch (error: any) {
    message.error(`上传失败: ${error.message || '未知错误'}`);
    onError(error);
  } finally {
    isUploading.value = false;
  }
};

// --- 6. 表单提交逻辑 (现在完全兼容头像) ---
async function handleSubmit() {
  try {
    await formRef.value?.validate();

    // 拷贝一份干净的数据用于提交，而不是直接用 formState
    const params: any = {
      username: formState.username,
      password: formState.password,
      full_name: formState.full_name,
      email: formState.email,
      phone: formState.phone,
      is_active: formState.is_active,
      is_superuser: formState.is_superuser,
      role_ids: formState.role_ids,
    };

    if (props.userData) {
      if (!params.password) delete params.password;
      await updateUser(props.userData.id, params);
      message.success('更新成功');
    } else {
      if (formState.avatar_file_record_id) {
        params.avatar_file_record_id = formState.avatar_file_record_id;
      }
      // 2. 调用创建接口
      await createUser(params);
      message.success('新增成功');
    }
    return true;
  } catch (error) {
    console.error('表单提交失败:', error);
    return false;
  }
}

defineExpose({ handleSubmit });
</script>

<template>
  <AForm ref="formRef" :model="formState" :rules="rules" layout="vertical">
    <AFormItem label="用户头像" name="avatar">
      <div class="flex items-center">
        <AAvatar :size="64" :src="formState.avatar_url">
          <template #icon><UserOutlined /></template>
        </AAvatar>
        <AUpload
          name="avatar"
          class="ml-4"
          :max-count="1"
          accept="image/png, image/jpeg, image/webp"
          :show-upload-list="false"
          :custom-request="customRequest"
        >
          <AButton :loading="isUploading">
            <UploadOutlined />
            {{ isUploading ? '上传中...' : '更换头像' }}
          </AButton>
        </AUpload>
      </div>
    </AFormItem>
    <AFormItem label="用户名" name="username">
      <AInput
        v-model:value="formState.username"
        placeholder="请输入用户名"
        :disabled="!!props.userData"
      />
    </AFormItem>

    <AFormItem label="密码" name="password">
      <AInput
        v-model:value="formState.password"
        type="password"
        :placeholder="props.userData ? '留空则不修改密码' : '请输入密码'"
      />
    </AFormItem>

    <AFormItem label="全名/昵称" name="full_name">
      <AInput v-model:value="formState.full_name" placeholder="请输入全名或昵称" />
    </AFormItem>

    <AFormItem label="邮箱" name="email">
      <AInput v-model:value="formState.email" placeholder="请输入邮箱" />
    </AFormItem>

    <AFormItem label="电话" name="phone">
      <AInput v-model:value="formState.phone" placeholder="请输入电话号码" />
    </AFormItem>

    <AFormItem label="角色" name="role_ids">
      <ASelect
        v-model:value="formState.role_ids"
        mode="multiple"
        placeholder="请选择用户角色"
        :options="roleOptions"
        :field-names="{ label: 'name', value: 'id' }"
      />
    </AFormItem>

    <AFormItem label="账户状态" name="is_active">
      <ASwitch v-model:checked="formState.is_active" />
      <span class="ml-2">{{ formState.is_active ? '启用' : '禁用' }}</span>
    </AFormItem>

    <template v-if="props.userData">
      <AFormItem label="超级用户" name="is_superuser">
        <ASwitch v-model:checked="formState.is_superuser" />
        <span class="ml-2">{{ formState.is_superuser ? '是' : '否' }}</span>
      </AFormItem>
    </template>
  </AForm>
</template>
