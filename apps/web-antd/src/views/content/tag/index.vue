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
  Tag
} from 'ant-design-vue';
import { SyncOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';
import { useTagManagement } from './useTagManagement';
import TagDrawer from './tagDrawer.vue';
import MergeTagsModal from './MergeTagsModal.vue';
import type { TagRead } from './types';
import { $t } from '#/locales';

const {
  loading,
  tableData,
  searchParams,
  pagination,
  selectedRowKeys,
  handleTableChange,
  handleSearch,
  handleReset,
  handleDeleteTag,
  handleBatchDelete,
  handleRestoreTags, // <-- 获取新方法
  handlePermanentDeleteTags, // <-- 获取新方法
  fetchData,
} = useTagManagement();

const tagDrawerRef = ref<InstanceType<typeof TagDrawer> | null>(null);
const mergeModalRef = ref<InstanceType<typeof MergeTagsModal> | null>(null);

const openDrawer = (mode: 'create' | 'update', record?: TagRead) => {
  tagDrawerRef.value?.open(mode, record);
};

// ▼▼▼ 【核心修改】修改 openMergeModal 函数 ▼▼▼
const openMergeModal = () => {
  // 如果有选中的行，则进入“上下文合并”模式
  if (selectedRowKeys.value.length >= 2) {
    // 从表格数据中过滤出完整的选中标签对象
    const selectedTags = tableData.items.filter(item => selectedRowKeys.value.includes(item.id));
    // 将选中的标签数据传递给模态框
    mergeModalRef.value?.open(selectedTags);
  } else {
    // 如果没有选中行，则进入“全局合并”模式
    mergeModalRef.value?.open();
  }
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);
// ▼▼▼ 【核心新增】用于判断合并按钮是否可用的计算属性 ▼▼▼
const canMerge = computed(() => selectedRowKeys.value.length >= 2);

const columns: TableColumnType<TagRead>[] = [
  { title: $t('page.content.tag.table.name'), dataIndex: 'name', key: 'name', sorter: true },

  {
    title: '状态',
    dataIndex: 'is_deleted',
    key: 'status',
    width: 100,
    align: 'center',
    // 使用 customRender 自定义显示
    customRender: ({ record }) => {
      const status = record.is_deleted;
      const color = status ? 'gray' : 'green';
      const text = status ? '已删除' : '活跃';
      return h(Tag, { color }, () => text);
    },
  },


  { title: $t('page.content.tag.table.recipeCount'), dataIndex: 'recipe_count', key: 'recipe_count', sorter: true, width: 120, align: 'center' },
  { title: $t('page.content.tag.table.createdAt'), dataIndex: 'created_at', key: 'created_at', width: 200, sorter: true, customRender: ({ text }) => new Date(text).toLocaleString() },
  { title: '操作', key: 'action', width: 150, fixed: 'right', align: 'center' },
];

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline">
        <FormItem label="查看模式">
          <RadioGroup v-model:value="searchParams.view_mode" button-style="solid" @change="handleSearch">
            <RadioButton value="active">只看活跃</RadioButton>
            <RadioButton value="all">查看全部</RadioButton>
            <RadioButton value="deleted">回收站</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="搜索">
          <Input
            v-model:value="searchParams.search"
            placeholder="按名称模糊搜索"
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
          <Button type="primary" @click="openDrawer('create')">新增标签</Button>
          <Button
            type="primary"
            @click="openMergeModal"

            :disabled="searchParams.view_mode !== 'active' || !canMerge"
          >
            合并标签
          </Button>

          <template v-if="searchParams.view_mode === 'active'">
            <Button type="primary" danger :disabled="!hasSelected" @click="handleBatchDelete">批量删除</Button>
          </template>
          <template v-if="searchParams.view_mode === 'deleted'">
            <Button type="primary" :disabled="!hasSelected" @click="() => handleRestoreTags(selectedRowKeys)">批量恢复</Button>
            <Button type="primary" danger :disabled="!hasSelected" @click="() => handlePermanentDeleteTags(selectedRowKeys)">批量永久删除</Button>
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
          <template v-if="column.key === 'action'">

            <Space v-if="!record.is_deleted">
              <Button type="link" size="small" @click="openDrawer('update', record)">编辑</Button>
              <Button type="link" danger size="small" @click="handleDeleteTag(record)">删除</Button>
            </Space>

            <Space v-else>
              <Button type="link" size="small" @click="() => handleRestoreTags([record.id])">恢复</Button>
              <Button type="link" danger size="small" @click="() => handlePermanentDeleteTags([record.id], record.name)">永久删除</Button>
            </Space>

          </template>
        </template>
      </Table>
    </Card>

    <TagDrawer ref="tagDrawerRef" @success="handleSearch" />
    <MergeTagsModal ref="mergeModalRef" @success="handleSearch" />
  </div>
</template>
