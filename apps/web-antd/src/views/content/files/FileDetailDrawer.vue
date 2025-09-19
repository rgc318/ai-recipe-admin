// 文件位置: src/views/content/file/components/FileDetailDrawer.vue

<script lang="ts" setup>
import { ref } from 'vue';
import { Drawer, Descriptions, DescriptionsItem, Image, Button, message, Tag } from 'ant-design-vue';
import type { FileRecordRead } from './types';

const visible = ref(false);
const fileData = ref<FileRecordRead | null>(null);

const open = (record: FileRecordRead) => {
  fileData.value = record;
  visible.value = true;
};

const handleCopyUrl = async () => {
  if (fileData.value?.url) {
    await navigator.clipboard.writeText(fileData.value.url);
    message.success('URL已复制到剪贴板');
  }
};

defineExpose({ open });
</script>

<template>
  <Drawer v-model:open="visible" title="文件详情" width="600px" destroy-on-close>
    <div v-if="fileData">
      <div v-if="fileData.content_type.startsWith('image/')" class="text-center mb-4">
        <Image :src="fileData.url" :width="200" />
      </div>
      <Descriptions bordered :column="1">
        <DescriptionsItem label="原始文件名">{{ fileData.original_filename }}</DescriptionsItem>
        <DescriptionsItem label="文件ID">{{ fileData.id }}</DescriptionsItem>
        <DescriptionsItem label="Object Name">{{ fileData.object_name }}</DescriptionsItem>
        <DescriptionsItem label="文件大小">{{ fileData.file_size }} 字节</DescriptionsItem>
        <DescriptionsItem label="文件类型">{{ fileData.content_type }}</DescriptionsItem>
        <DescriptionsItem label="存储Profile">{{ fileData.profile_name }}</DescriptionsItem>
        <DescriptionsItem label="URL">
          <div class="flex items-center gap-2">
            <a :href="fileData.url" target="_blank" class="truncate">{{ fileData.url }}</a>
            <Button size="small" @click="handleCopyUrl">复制</Button>
          </div>
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Tag :color="fileData.is_deleted ? 'gray' : 'green'">
            {{ fileData.is_deleted ? '已删除' : '活跃' }}
          </Tag>
        </DescriptionsItem>
      </Descriptions>
    </div>
  </Drawer>
</template>

<style scoped>
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
