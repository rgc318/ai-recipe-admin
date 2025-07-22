<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
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
import { createUser, updateUser, generateAvatarUploadPolicy, linkUploadedAvatar } from '#/api/management/user';

// --- 组件通信 (Props) ---

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

// --- 表单状态与规则 ---
const formRef = ref<FormInstance>();
const formState = reactive({
  username: '',
  password: '',
  full_name: '',
  email: '',
  phone: '',
  is_active: true,
  is_superuser: false,
  role_ids: [], // 用来存储被选中的角色ID
  avatar_url: '', // 【新增】用于存储和显示头像URL
});

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [
    // 只有在新增模式下，密码才是必填的
    { required: !props.userData, message: '请输入密码' },
  ],
  role_ids: [{ required: true, message: '请至少选择一个角色' }],
};


// 【新增】Upload组件的状态
const fileList = ref<UploadProps['fileList']>([]);
const uploading = ref(false);
// --- 核心逻辑 ---

// 使用 watch 监听 props.userData 的变化，当父组件传入数据时，自动填充表单
watch(
  () => props.userData,
  (newUser) => {
    if (newUser) {
      // ----------------------------------------------------
      // 编辑模式：使用逐个字段赋值，确保响应性正确更新
      formState.avatar_url = newUser.full_avatar_url || ''; // 使用 full_avatar_url 来显示
      formState.username = newUser.username;
      formState.full_name = newUser.full_name || '';
      formState.email = newUser.email || '';
      formState.phone = newUser.phone || '';
      formState.is_active = newUser.is_active;
      formState.is_superuser = newUser.is_superuser;

      // 从用户对象中提取出角色的ID列表，用于Select的回显
      formState.role_ids = newUser.roles?.map((role: any) => role.id) || [];

      // 编辑模式下密码框默认为空，不回显密码
      formState.password = '';
      // ----------------------------------------------------
      if (formState.avatar_url) {
        fileList.value = [{
          uid: '-1',
          name: 'current_avatar.png',
          status: 'done',
          url: formState.avatar_url,
        }];
      } else {
        fileList.value = [];
      }
    } else {
      // 新增模式：重置表单为初始状态
      // formRef.value?.resetFields() 会重置校验状态和值
      formRef.value?.resetFields();
      // 确保我们的响应式对象也恢复默认
      Object.assign(formState, {
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        is_active: true,
        is_superuser: false,
        role_ids: [],
      });
    }
  },
  { immediate: true, deep: true }, // deep: true 可以在某些边缘情况下提供更可靠的侦听
);

// 【新增】自定义上传逻辑
const customRequest = async ({ file, onSuccess, onError }: any) => {
  uploading.value = true;
  try {
    // 步骤1: 获取预签名POST策略
    const policyRes = await generateAvatarUploadPolicy({
      original_filename: file.name,
      content_type: file.type,
    });
    const policyData = policyRes;

    // 步骤2: 上传文件到Minio
    const formData = new FormData();
    for (const key in policyData.fields) {
      formData.append(key, policyData.fields[key]);
    }
    formData.append('file', file);

    const uploadResponse = await fetch(policyData.url, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('上传到对象存储失败');
    }
    const etag = uploadResponse.headers.get('ETag')?.replaceAll('"', '');

    // 步骤3: 通知后端关联文件
    const linkRes = await linkUploadedAvatar({
      object_name: policyData.object_name,
      original_filename: file.name,
      content_type: file.type,
      file_size: file.size,
      etag: etag,
    });

    // 步骤4: 更新UI
    formState.avatar_url = linkRes.full_avatar_url || '';
    message.success('头像更新成功！');
    onSuccess?.(linkRes); // 通知 a-upload 组件上传成功

  } catch (error: any) {
    message.error(`上传失败: ${error.message || '未知错误'}`);
    onError?.(error); // 通知 a-upload 组件上传失败
  } finally {
    uploading.value = false;
  }
};

// 限制只能上传一张图片
// 【修复】将 info 的类型改为 any 来解决导入问题
const handleChange = (info: any) => {
  if (info && info.fileList) {
    fileList.value = info.fileList.slice(-1);
  }
};


// 暴露给父组件(UserDrawer)调用的方法
async function handleSubmit() {
  try {
    await formRef.value?.validate(); // 触发表单校验

    const params = { ...formState };
    // 如果是编辑模式且密码为空，则不提交password字段
    if (props.userData && !params.password) {
      delete params.password;
    }

    if (props.userData) {
      // 编辑模式
      await updateUser(props.userData.id, params);
      message.success('更新成功');
    } else {
      // 新增模式
      await createUser(params);
      message.success('新增成功');
    }
    return true; // 返回 true 表示成功
  } catch (error) {
    console.error('表单提交失败:', error);
    // message.error(...) 会在全局请求拦截器中处理，这里可以不重复提示
    return false; // 返回 false 表示失败
  }
}

// 将 handleSubmit 方法暴露出去
defineExpose({
  handleSubmit,
});
</script>

<template>
  <AForm ref="formRef" :model="formState" :rules="rules" layout="vertical">
    <AFormItem label="用户头像" name="avatar">
      <div class="flex items-center">
        <AAvatar :size="64" :src="formState.avatar_url">
          <template #icon><UserOutlined /></template>
        </AAvatar>
        <AUpload
          v-model:file-list="fileList"
          name="avatar"
          class="ml-4"
          :max-count="1"
          accept="image/png, image/jpeg, image/webp"
          :show-upload-list="false"
          :custom-request="customRequest"
          @change="handleChange"
        >
          <AButton :loading="uploading">
            <UploadOutlined />
            {{ uploading ? '上传中...' : '更换头像' }}
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
