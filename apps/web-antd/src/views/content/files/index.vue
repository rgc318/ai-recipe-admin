<script lang="ts" setup>
import { onMounted, h, ref, computed } from 'vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Table,
  Space,
  Tooltip,
  RadioGroup,
  RadioButton,
  Tag,
  Image, // [新增] 用于图片预览
  Select, message, // [新增] 用于过滤器
} from 'ant-design-vue';
import { SyncOutlined, FileOutlined } from '@ant-design/icons-vue'; // [新增] 文件图标
import type { TableColumnType } from 'ant-design-vue';
import { useFileManagement } from './useFileManagement';
import FileDetailDrawer from './FileDetailDrawer.vue'; // [新增] 引入详情抽屉
import MergeFilesModal from './MergeFilesModal.vue';
import type { FileRecordRead } from './types';
import { $t } from '#/locales';
import UploadModal from "#/views/content/files/UploadModal.vue"; // 假设用于国际化

// =================================================================
//                      1. 实例化核心逻辑
// =================================================================
const {
  loading,
  tableData,
  searchParams,
  pagination,
  selectedRowKeys,
  handleTableChange,
  handleSearch,
  handleReset,
  handleSoftDelete,
  handleBatchSoftDelete,
  handleRestore,
  handlePermanentDelete,
  handleBatchPermanentDelete,
  fetchData,
} = useFileManagement();


// =================================================================
//                      2. 组件引用和交互
// =================================================================
const detailDrawerRef = ref<InstanceType<typeof FileDetailDrawer> | null>(null);

const openDrawer = (record: FileRecordRead) => {
  detailDrawerRef.value?.open(record);
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);
const mergeModalRef = ref<InstanceType<typeof MergeFilesModal> | null>(null); // 2. 为模态框创建 ref


// 2. 为上传模态框创建 ref
const uploadModalRef = ref<InstanceType<typeof UploadModal> | null>(null);

// 3. 添加打开模态框的函数
const openUploadModal = () => {
  uploadModalRef.value?.open();
};


// 3. 添加打开模态框的函数 (逻辑与 Tag 模块完全一样)
const openMergeModal = () => {
  if (selectedRowKeys.value.length >= 2) {
    const selectedFiles = tableData.items.filter(item => selectedRowKeys.value.includes(item.id));
    mergeModalRef.value?.open(selectedFiles);
  } else {
    // 可以在这里提示用户需要选择至少两项，或者打开一个“全局合并”模态框
    message.warning('请至少选择两个文件记录进行合并。');
  }
};
const canMerge = computed(() => selectedRowKeys.value.length >= 2);
// =================================================================
//                      3. 表格列定义
// =================================================================

// 一个辅助函数，用于格式化文件大小
function bytesToSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const columns: TableColumnType<FileRecordRead>[] = [
  {
    title: '预览',
    dataIndex: 'preview',
    key: 'preview',
    width: 80,
    align: 'center',
  },
  {
    title: '原始文件名',
    dataIndex: 'original_filename',
    key: 'filename',
    sorter: true
  },
  {
    title: '文件信息',
    dataIndex: 'info',
    key: 'info',
    width: 200,
  },
  {
    title: '存储 Profile',
    dataIndex: 'profile_name',
    key: 'profile',
    width: 150,
    align: 'center'
  },
  {
    title: '状态',
    dataIndex: 'is_deleted',
    key: 'status',
    width: 100,
    align: 'center',
  },
  {
    title: '上传时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 200,
    sorter: true
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right',
    align: 'center'
  },
];

// 组件挂载后首次加载数据
onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline">
        <FormItem label="查看模式">
          <RadioGroup v-model:value="searchParams.view_mode" button-style="solid" @change="handleSearch">
            <RadioButton value="active">活跃文件</RadioButton>
            <RadioButton value="all">全部文件</RadioButton>
            <RadioButton value="deleted">回收站</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="文件名搜索">
          <Input
            v-model:value="searchParams.original_filename"
            placeholder="按原始文件名模糊搜索"
            allow-clear
            @pressEnter="handleSearch"
          />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" :loading="loading" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <Card :bordered="false">
      <div class="mb-4 flex justify-between items-center">
        <Space>
          <Button type="primary" @click="openUploadModal">上传文件</Button>

          <Button
            type="primary"
            @click="openMergeModal"
            :disabled="!canMerge || searchParams.view_mode !== 'active'"
          >
            合并记录
          </Button>

          <template v-if="searchParams.view_mode === 'active'">
            <Button type="primary" danger :disabled="!hasSelected" @click="handleBatchSoftDelete">批量删除</Button>
          </template>
          <template v-if="searchParams.view_mode === 'deleted'">
            <Button type="primary" :disabled="!hasSelected" @click="() => handleRestore(selectedRowKeys)">批量恢复</Button>
            <Button type="primary" danger :disabled="!hasSelected" @click="handleBatchPermanentDelete">批量永久删除</Button>
          </template>

          <span v-if="hasSelected" class="text-gray-500 text-sm">已选择 {{ selectedRowKeys.length }} 项</span>
        </Space>
        <Tooltip title="刷新">
          <Button shape="circle" :icon="h(SyncOutlined)" :loading="loading" @click="fetchData" />
        </Tooltip>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData.items"
        :pagination="pagination"
        :loading="loading"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: (keys) => selectedRowKeys = keys as string[] }"
        row-key="id"
        bordered
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'preview'">
            <Image
              v-if="record.content_type.startsWith('image/')"
              :src="record.url"
              :width="50"
              :height="50"
              class="object-cover"
            />
            <FileOutlined v-else class="text-3xl text-gray-400" />
          </template>

          <template v-if="column.key === 'filename'">
            <a @click="openDrawer(record)">{{ record.original_filename }}</a>
          </template>

          <template v-if="column.key === 'info'">
            <div>{{ bytesToSize(record.file_size) }}</div>
            <div class="text-gray-500 text-xs">{{ record.content_type }}</div>
          </template>

          <template v-if="column.key === 'profile'">
            <Tag>{{ record.profile_name }}</Tag>
          </template>

          <template v-if="column.key === 'status'">
            <Tag :color="record.is_deleted ? 'gray' : 'green'">
              {{ record.is_deleted ? '已删除' : '活跃' }}
            </Tag>
          </template>

          <template v-if="column.key === 'created_at'">
            {{ new Date(record.created_at).toLocaleString() }}
          </template>

          <template v-if="column.key === 'action'">
            <Space v-if="!record.is_deleted">
              <Button type="link" size="small" @click="openDrawer(record)">详情</Button>
              <Button type="link" danger size="small" @click="handleSoftDelete(record)">删除</Button>
            </Space>
            <Space v-else>
              <Button type="link" size="small" @click="() => handleRestore([record.id])">恢复</Button>
              <Button type="link" danger size="small" @click="handlePermanentDelete(record)">永久删除</Button>
            </Space>
          </template>

        </template>
      </Table>
    </Card>

    <FileDetailDrawer ref="detailDrawerRef" @success="handleSearch" />
    <MergeFilesModal ref="mergeModalRef" @success="handleSearch" />

    <UploadModal ref="uploadModalRef" @success="fetchData" />
  </div>
</template>

<style scoped>
/* 让图片在表格单元格里表现更好 */
.object-cover {
  object-fit: cover;
}
</style>
