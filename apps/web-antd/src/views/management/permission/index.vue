<script lang="ts" setup>
import { onMounted, h } from 'vue';
import {
  Button, Card, Form, FormItem, Input, Select, Table, Tag, Space, Popconfirm, Tooltip,
  RadioGroup, RadioButton,
} from 'ant-design-vue';
import { SyncOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';
import { usePermissionManagement } from './usePermissionManagement';
import type { PermissionRead } from './types';
import { useAuthStore } from '#/store';

const authStore = useAuthStore();
const {
  loading, syncLoading, tableData, searchParams, pagination,
  selectedRowKeys, hasSelected, rowSelection,
  permissionGroupOptions,
  handleTableChange, handleSearch, handleReset,
  handleSyncPermissions, handlePermanentDelete,
  refreshData,
} = usePermissionManagement();

const columns: TableColumnType<PermissionRead>[] = [
  { title: '所属模块', dataIndex: 'group', key: 'group', width: 180, sorter: true },
  { title: '权限名称', dataIndex: 'name', key: 'name', width: 200, sorter: true },
  { title: '权限代码', dataIndex: 'code', key: 'code', sorter: true, customRender: ({ text }) => h(Tag, { color: 'geekblue' }, () => text) },
  {
    title: '状态', key: 'status', width: 100, align: 'center',
    customRender: ({ record }) => {
      // is_deleted 在权限模块的业务含义是“已禁用”
      const color = record.is_deleted ? 'gray' : 'success';
      const text = record.is_deleted ? '已禁用' : '活跃';
      return h(Tag, { color }, () => text);
    },
  },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
];
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline" class="flex flex-wrap gap-x-4">
        <FormItem v-if="authStore.isSuperuser" label="查看模式">
          <RadioGroup v-model:value="searchParams.view_mode" button-style="solid" @change="handleSearch">
            <RadioButton value="active">活跃权限</RadioButton>
            <RadioButton value="all">全部</RadioButton>
            <RadioButton value="deleted">回收站</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="所属模块">
          <Select
            v-model:value="searchParams.group"
            :options="permissionGroupOptions"
            placeholder="按模块筛选"
            allow-clear
            style="width: 200px"
          />
        </FormItem>
        <FormItem label="搜索">
          <Input v-model:value="searchParams.search" placeholder="搜索名称/代码" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem><Space>
          <Button type="primary" :loading="loading" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space></FormItem>
      </Form>
    </Card>

    <Card :bordered="false">
      <div class="mb-4 flex justify-between items-center">
        <Space>
          <Popconfirm title="确定要从代码源同步所有权限吗？" @confirm="handleSyncPermissions">
            <Button type="primary" :loading="syncLoading">同步权限</Button>
          </Popconfirm>
          <Popconfirm title="确定要永久删除选中的已禁用权限吗？" @confirm="handlePermanentDelete">
            <Button type="danger" ghost :disabled="!hasSelected || searchParams.view_mode !== 'all'">清理权限</Button>
          </Popconfirm>
          <div class="text-xs text-gray-400">权限的增、改、删由代码配置驱动</div>
        </Space>
        <Tooltip title="刷新"><Button shape="circle" :icon="h(SyncOutlined)" :loading="loading" @click="refreshData" /></Tooltip>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData.items"
        :pagination="pagination"
        :loading="loading"
        :row-selection="rowSelection"
        row-key="id"
        bordered
        size="small"
        :scroll="{ y: 'calc(100vh - 420px)' }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Popconfirm
              v-if="record.is_deleted"
              title="确定要永久删除这个权限吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handlePermanentDelete({ permission_ids: [record.id] })"
            >
              <Button type="link" danger size="small">永久删除</Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
