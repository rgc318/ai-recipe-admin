<script setup lang="ts">
import {reactive, ref, watch} from 'vue';
import { Form, FormItem, Input, Button, Row, Col, Upload, message, Avatar } from 'ant-design-vue';
import { PlusOutlined, LoadingOutlined, UserOutlined } from '@ant-design/icons-vue';
import type {AvatarLinkDTO, UserReadWithRoles} from '#/views/management/user/types';
import {generateMyAvatarUploadPolicy, linkMyUploadedAvatar} from '#/api/profile/profile';
// import { registerFile } from '#/api/management/files/file';
import type {FileRecordRead} from "#/views/recipe/types";
import axios from 'axios';

const props = defineProps<{
  profileData: UserReadWithRoles | null;
  loading: boolean;
}>();

const emit = defineEmits(['updateProfile', 'profileUpdated']);
const isUploading = ref(false); // 使用本地的 isUploading 状态

const formState = reactive({
  username: '',
  full_name: '',
  email: '',
  phone: '', // 1. 在 formState 中添加 phone 字段
  full_avatar_url: '',
});

watch(() => props.profileData, (newData) => {
  if (newData) {
    formState.username = newData.username;
    formState.full_name = newData.full_name || '';
    formState.email = newData.email || '';
    formState.phone = newData.phone || ''; // 2. 从 props 中同步 phone 数据
    formState.full_avatar_url = newData.full_avatar_url || '';
  }
}, { immediate: true, deep: true });

const onFinish = () => {
  // 4. 在提交时，将 phone 字段包含进去
  emit('updateProfile', {
    full_name: formState.full_name,
    email: formState.email,
    phone: formState.phone,
  });
};

// ▼▼▼ 3.【核心重构】实现预签名上传的 customRequest ▼▼▼
const onAvatarUpload = async ({ file, onSuccess, onError, onProgress }) => {
  isUploading.value = true;
  try {
    // 步骤 A: 获取预签名URL
    // 【重要修正】确保在这里传递了文件名和文件类型
    const policy = await generateMyAvatarUploadPolicy({
      original_filename: file.name,
      content_type: file.type,
    });

    // 步骤 B: 物理上传文件到云 (这部分不变)
    const formData = new FormData();
    Object.keys(policy.fields).forEach(key => formData.append(key, policy.fields[key]));
    formData.append('file', file);
    await axios.post(policy.url, formData, {
      onUploadProgress: (event) => {
        if (event.total) onProgress({ percent: Math.round((event.loaded * 100) / event.total) });
      },
    });

    // 步骤 C: 关联头像 (这部分不变)
    const avatarDto: AvatarLinkDTO = {
      object_name: policy.object_name,
      original_filename: file.name,
      content_type: file.type,
      file_size: file.size,
    };
    const updatedUser = await linkMyUploadedAvatar(avatarDto);

    // 步骤 D: 成功！ (这部分不变)
    onSuccess(updatedUser);
    message.success('头像更新成功！');
    emit('profileUpdated', updatedUser);

  } catch (error) {
    console.error('头像上传失败:', error);
    // 这里可以进一步判断，如果是后端验证错误，可以给出更具体的提示
    message.error('头像上传失败，请重试');
    onError(error);
  } finally {
    isUploading.value = false;
  }
};

const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isJpgOrPng || !isLt2M) {
    message.error('请上传 2MB 以下的 JPG/PNG 格式图片!');
  }
  return isJpgOrPng && isLt2M;
};
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-6">基本资料</h2>
    <Row :gutter="[48, 16]">
      <Col :xs="24" :sm="24" :md="16">
        <Form :model="formState" layout="vertical" @finish="onFinish">
          <FormItem label="用户名">
            <Input v-model:value="formState.username" disabled />
          </FormItem>
          <FormItem label="全名" name="full_name">
            <Input v-model:value="formState.full_name" placeholder="请输入您的全名或昵称" />
          </FormItem>
          <FormItem label="邮箱" name="email">
            <Input v-model:value="formState.email" placeholder="请输入您的邮箱地址" />
          </FormItem>

          <FormItem label="手机号" name="phone">
            <Input v-model:value="formState.phone" placeholder="请输入您的手机号" />
          </FormItem>
          <FormItem>
            <Button type="primary" html-type="submit" :loading="loading">保存修改</Button>
          </FormItem>
        </Form>
      </Col>
      <Col :xs="24" :sm="24" :md="8" class="flex flex-col items-center">
        <h3 class="text-base font-medium mb-2">我的头像</h3>
        <Upload
          name="avatar"
          list-type="picture-card"
          class="avatar-uploader"
          :show-upload-list="false"
          :before-upload="beforeUpload"
          :custom-request="onAvatarUpload"
        >
          <img v-if="formState.full_avatar_url" :src="formState.full_avatar_url" alt="avatar" class="w-full h-full object-cover" />
          <div v-else>
            <LoadingOutlined v-if="isUploading" />
            <PlusOutlined v-else />
            <div class="ant-upload-text mt-2">上传</div>
          </div>
        </Upload>
      </Col>
    </Row>
  </div>
</template>

<style lang="less">
.avatar-uploader > .ant-upload {
  width: 128px; height: 128px; border-radius: 50%; overflow: hidden;
}
</style>
