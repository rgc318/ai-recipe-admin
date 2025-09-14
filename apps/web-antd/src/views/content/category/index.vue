<script lang="ts" setup>
import { onMounted, h, ref, computed } from 'vue';
import {
  Button, Card, Form, FormItem, Input, Table, Space, Tooltip, RadioGroup, RadioButton, Tag as ATag,
} from 'ant-design-vue';
import { SyncOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';
import { useCategoryManagement } from './useCategoryManagement';
import CategoryModal from './categoryModal.vue'; // <-- [修正] 引入 Modal
import MergeCategoriesModal from './MergeCategoriesModal.vue';
import type { CategoryRead } from './types';

const {
  loading, tableData, searchParams, pagination, selectedRowKeys,
  handleTableChange, handleSearch, handleReset, handleDeleteCategory,
  handleBatchDelete, handleRestoreCategories, handlePermanentDeleteCategories, fetchData,
} = useCategoryManagement();

const modalRef = ref<InstanceType<typeof CategoryModal> | null>(null); // <-- [修正]
const mergeModalRef = ref<InstanceType<typeof MergeCategoriesModal> | null>(null);

const openModal = (mode: 'create' | 'update', record?: CategoryRead) => { // <-- [修正]
  modalRef.value?.open(mode, record);
};

const openMergeModal = () => {
  if (selectedRowKeys.value.length >= 2) {
    const selected = tableData.items.filter(item => selectedRowKeys.value.includes(item.id));
    mergeModalRef.value?.open(selected);
  } else {
    mergeModalRef.value?.open();
  }
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);
const canMerge = computed(() => selectedRowKeys.value.length >= 2);

const columns: TableColumnType<CategoryRead>[] = [
  { title: '名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '别名 (Slug)', dataIndex: 'slug', key: 'slug' },
  { title: '父级分类', dataIndex: ['parent', 'name'], key: 'parent_name' },
  {
    title: '状态',
    dataIndex: 'is_deleted',
    key: 'status',
    width: 100,
    align: 'center',
    customRender: ({ record }) => h(ATag, { color: record.is_deleted ? 'gray' : 'green' }, () => record.is_deleted ? '已删除' : '活跃'),
  },
  { title: '菜谱数', dataIndex: 'recipe_count', key: 'recipe_count', sorter: true, width: 120, align: 'center' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200, sorter: true, customRender: ({ text }) => new Date(text).toLocaleString() },
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
          <Input v-model:value="searchParams.name" placeholder="按分类名称搜索" allow-clear @pressEnter="handleSearch" />
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
          <Button type="primary" @click="openModal('create')">新增分类</Button> <Button type="primary" @click="openMergeModal" :disabled="searchParams.view_mode !== 'active' || !canMerge">
          合并分类
        </Button>
          <template v-if="searchParams.view_mode === 'active'">
            <Button type="primary" danger :disabled="!hasSelected" @click="handleBatchDelete">批量删除</Button>
          </template>
          <template v-if="searchParams.view_mode === 'deleted'">
            <Button type="primary" :disabled="!hasSelected" @click="() => handleRestoreCategories(selectedRowKeys)">批量恢复</Button>
            <Button type="primary" danger :disabled="!hasSelected" @click="() => handlePermanentDeleteCategories(selectedRowKeys)">批量永久删除</Button>
          </template>
          <span v-if="hasSelected" class="text-gray-500 text-sm">已选择 {{ selectedRowKeys.length }} 项</span>
        </Space>
        <Tooltip title="刷新">
          <Button shape="circle" :icon="h(SyncOutlined)" :loading="loading" @click="fetchData" />
        </Tooltip>
      </div>

      <Table :columns="columns" :data-source="tableData.items" :pagination="pagination" :loading="loading" :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: (keys) => selectedRowKeys = keys as string[] }" row-key="id" bordered size="small" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Space v-if="!record.is_deleted">
              <Button type="link" size="small" @click="openModal('update', record)">编辑</Button> <Button type="link" danger size="small" @click="handleDeleteCategory(record)">删除</Button>
            </Space>
            <Space v-else>
              <Button type="link" size="small" @click="() => handleRestoreCategories([record.id])">恢复</Button>
              <Button type="link" danger size="small" @click="() => handlePermanentDeleteCategories([record.id], record.name)">永久删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <CategoryModal ref="modalRef" @success="handleSearch" /> <MergeCategoriesModal ref="mergeModalRef" @success="handleSearch" />
  </div>
</template>
