<script lang="ts" setup>
import { onMounted, h } from 'vue';
import { Button, Card, Form, FormItem, Input, Table, Tag, Space, Tooltip } from 'ant-design-vue';
import {
  SyncOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  RightOutlined,
  DownOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';

import { useCategoryManagement } from './useCategoryManagement';
import type { CategoryRead } from './types';
import CategoryModal from './CategoryModal.vue';

const {
  loading,
  searchText,
  filteredTreeData,
  expandedKeys, // <-- 这是简单的 ref
  onExpandedKeysChange, // <-- 这是更新函数
  modalVisible, modalLoading, modalTitle, currentCategory,
  fetchData,
  handleAddNew,
  handleAddChild,
  handleEdit,
  handleDelete,
  handleModalOk,
  handleReset,
} = useCategoryManagement();

const columns: TableColumnType<CategoryRead>[] = [
  { title: '分类名称', dataIndex: 'name', key: 'name' },
  { title: '别名 (Slug)', dataIndex: 'slug', key: 'slug' },
  {
    title: '父级分类',
    dataIndex: ['parent', 'name'],
    key: 'parent_name',
    customRender: ({ record }) => {
      return record.parent ? record.parent.name : h(Tag, {}, () => '顶级分类');
    },
  },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  {
    title: '操作',
    key: 'action',
    width: 150,
    customRender: ({ record }) => h(Space, {}, () => [
      h(Tooltip, { title: '新增子分类' }, () =>
        h(Button, { type: 'link', shape: 'circle', icon: h(PlusCircleOutlined), onClick: () => handleAddChild(record) }),
      ),
      h(Tooltip, { title: '编辑' }, () =>
        h(Button, { type: 'link', shape: 'circle', icon: h(EditOutlined), onClick: () => handleEdit(record) }),
      ),
      h(Tooltip, { title: '删除' }, () =>
        h(Button, { type: 'link', shape: 'circle', danger: true, icon: h(DeleteOutlined), onClick: () => handleDelete(record.id) }),
      ),
    ]),
  },
];

onMounted(() => { fetchData(); });
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form layout="inline">
        <FormItem label="分类名称">
          <Space>
            <Input v-model:value="searchText" placeholder="按名称模糊搜索" allow-clear />
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <Card :bordered="false">
      <div class="mb-4 flex justify-between items-center">
        <!-- 【修正】按钮文案改回“新增分类” -->
        <Button type="primary" :icon="h(PlusOutlined)" @click="handleAddNew">新增分类</Button>
        <Tooltip title="刷新">
          <Button shape="circle" :icon="h(SyncOutlined)" :loading="loading" @click="fetchData" />
        </Tooltip>
      </div>

      <Table
        :columns="columns"
        :data-source="filteredTreeData"
        :loading="loading"
        row-key="id"
        bordered
        size="small"
        :pagination="false"
        :indent-size="25"

        :expanded-row-keys="expandedKeys"
        @update:expanded-row-keys="onExpandedKeysChange"
      >
        <template #expandIcon="{ expanded, onExpand, record }">
          <span v-if="!record.children || record.children.length === 0" class="ant-table-row-expand-icon ant-table-row-spaced" />
          <span v-else class="cursor-pointer text-gray-500" @click="e => onExpand(record, e)">
            <DownOutlined v-if="expanded" />
            <RightOutlined v-else />
          </span>
        </template>
      </Table>
    </Card>

    <CategoryModal
      v-model:visible="modalVisible"
      :loading="modalLoading"
      :title="modalTitle"
      :category-data="currentCategory"
      @ok="handleModalOk"
    />
  </div>
</template>
