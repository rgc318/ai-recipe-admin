<script lang="ts" setup>
import { onMounted, h } from 'vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Select,
  Table,
  Tag,
  Space,
  Popconfirm,
  Tooltip,
} from 'ant-design-vue';
import { SyncOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';

import { usePermissionManagement } from './usePermissionManagement';
import type { PermissionRead } from './types';
import { $t } from '#/locales';

const {
  loading,
  tableData,
  searchParams,
  pagination,
  permissionGroupOptions, // <--- 在这里接收
  handleTableChange,
  handleSearch,
  handleReset,
  handleSyncPermissions,
  fetchData,
} = usePermissionManagement();

// 定义表格列
const columns: TableColumnType<PermissionRead>[] = [
  {
    title: $t('page.permission.group'),
    dataIndex: 'group',
    key: 'group',
    width: 180,
    sorter: true,
  },
  {
    title: $t('page.permission.name'),
    dataIndex: 'name',
    key: 'name',
    width: 200,
    sorter: true,
  },
  {
    title: $t('page.permission.code'),
    dataIndex: 'code',
    key: 'code',
    width: 250,
    sorter: true,
    customRender: ({ text }) => h(Tag, { color: 'geekblue' }, () => text),
  },
  {
    title: $t('page.permission.description'),
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
];

// 组件挂载时加载初始数据
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline" class="flex flex-wrap gap-x-4">
        <FormItem :label="$t('page.permission.group')">
          <Select
            v-model:value="searchParams.group"
            :options="permissionGroupOptions" placeholder="请选择所属模块进行过滤"
            allow-clear
            style="width: 200px"
          />
        </FormItem>
        <FormItem :label="$t('common.search')">
          <Input
            v-model:value="searchParams.search"
            :placeholder="`${$t('page.permission.name')}/${$t('page.permission.code')}`"
            allow-clear
            @pressEnter="handleSearch"
          />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" :loading="loading" @click="handleSearch">{{ $t('common.query') }}</Button>
            <Button @click="handleReset">{{ $t('common.reset') }}</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <Card :bordered="false">
      <div class="mb-4 flex justify-between items-center">
        <Space>
          <Popconfirm
            :title="$t('page.permission.syncConfirmationTitle')"
            :ok-text="$t('common.confirm')"
            :cancel-text="$t('common.cancel')"
            @confirm="handleSyncPermissions"
          >
            <template #icon><QuestionCircleOutlined style="color: red" /></template>
            <Button type="primary">{{ $t('page.permission.syncPermissions') }}</Button>
          </Popconfirm>
          <div class="text-xs text-gray-400">{{ $t('page.permission.syncConfirmationDesc') }}</div>
        </Space>
        <Tooltip :title="$t('common.refresh')">
          <Button shape="circle" :icon="h(SyncOutlined)" :loading="loading" @click="fetchData" />
        </Tooltip>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData.items"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        bordered
        size="small"
        :scroll="{ y: 'calc(100vh - 420px)' }"
        @change="handleTableChange"
      />
    </Card>
  </div>
</template>
