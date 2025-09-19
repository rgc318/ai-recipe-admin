// 建议的文件位置: src/views/content/file/components/UploadModal.vue

<script lang="ts" setup>
import { ref } from 'vue';
import { Modal, Select, Form, FormItem, UploadDragger, message } from 'ant-design-vue';
import { InboxOutlined } from '@ant-design/icons-vue';
import { useUploader } from '#/hooks/web/useUploader';
import type { UploadChangeParam } from 'ant-design-vue';

const emit = defineEmits(['success']);

const visible = ref(false);
// 存储当前选择要上传到的 Profile
const selectedProfile = ref('general_files');
// 存储已上传的文件列表，用于判断何时关闭模态框
const fileList = ref([]);

// 实例化我们通用的 uploader
const { customRequest, isLoading } = useUploader();

// 定义可用的 Profile 选项
const profileOptions = [
  { value: 'general_files', label: '通用文件 (General)' },
  { value: 'recipe_images', label: '菜谱图片 (Recipes)' },
  { value: 'user_avatars', label: '用户头像 (Avatars)' },
];

const open = () => {
  visible.value = true;
};

const handleCancel = () => {
  // 如果正在上传，阻止关闭
  if (isLoading.value) {
    message.warning('文件正在上传中，请稍候...');
    return;
  }
  // 关闭时清空文件列表
  fileList.value = [];
  visible.value = false;
};

// 监听上传状态的变化
const handleChange = (info: UploadChangeParam) => {
  fileList.value = info.fileList; // 同步文件列表

  // 检查是否所有文件都上传完成了
  const allDone = info.fileList.every(file => file.status === 'done' || file.status === 'error');

  if (!isLoading.value && allDone && info.fileList.length > 0) {
    // 所有文件处理完毕后
    message.success(`${info.fileList.filter(f => f.status === 'done').length} 个文件上传成功！`);
    emit('success'); // 通知父组件刷新

    // 延迟一点关闭模态框，给用户看成功提示的时间
    setTimeout(() => {
      handleCancel();
    }, 1000);
  }
};

defineExpose({ open });
</script>

<template>
  <Modal
    v-model:open="visible"
    title="上传新文件"
    :footer="null"
    @cancel="handleCancel"
    width="600px"
  >
    <Form layout="vertical" class="mt-4">
      <FormItem label="选择上传目标 (Storage Profile)">
        <Select
          v-model:value="selectedProfile"
          :options="profileOptions"
          placeholder="请选择文件要上传到的业务分类"
        />
      </FormItem>

      <FormItem label="拖拽或点击上传">
        <UploadDragger
          multiple
          :file-list="fileList"
          :custom-request="customRequest"
          :data="{ profileName: selectedProfile }"
          @change="handleChange"
        >
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此区域以上传</p>
          <p class="ant-upload-hint">
            支持单次或批量上传。文件类型和大小限制取决于所选的 Profile。
          </p>
        </UploadDragger>
      </FormItem>
    </Form>
  </Modal>
</template>
