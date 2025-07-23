<script lang="ts" setup>
import { onMounted, h, ref } from 'vue';
import {
  Button, Card, Form, FormItem, Input, Table, Tag, Space, Popconfirm, Tooltip,
} from 'ant-design-vue';
import { SyncOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';

import { useRoleManagement } from './useRoleManagement';
import RoleDrawer from './roleDrawer.vue';
import type { RoleReadWithPermissions } from './types';
import { $t } from '#/locales';

const {
  loading,
  tableData,
  searchParams,
  pagination,
  handleTableChange,
  handleSearch,
  handleReset,
  handleDeleteRole,
  fetchData,
} = useRoleManagement();

const roleDrawerRef = ref<InstanceType<typeof RoleDrawer> | null>(null);

const openDrawer = (mode: 'create' | 'update', record?: RoleReadWithPermissions) => {
  roleDrawerRef.value?.open(mode, record);
};

const columns: TableColumnType<RoleReadWithPermissions>[] = [
  { title: '角色名称', dataIndex: 'name', key: 'name', width: 200, sorter: true },
  { title: '角色代码', dataIndex: 'code', key: 'code', width: 200, sorter: true, customRender: ({ text }) => h(Tag, { color: 'geekblue' }, () => text) },
  { title: '关联权限', dataIndex: 'permissions', key: 'permissions' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200, sorter: true, customRender: ({ text }) => new Date(text).toLocaleString() },
  { title: '操作', key: 'action', width: 150, fixed: 'right', align: 'center' },
];

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline">
        <FormItem label="搜索">
          <Input
            v-model:value="searchParams.search"
            placeholder="按名称/代码模糊搜索"
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
        <Button type="primary" @click="openDrawer('create')">新增角色</Button>
        <Tooltip title="刷新">
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
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions'">
            <div v-if="record.permissions?.length" class="flex flex-wrap gap-1">
              <Tooltip v-for="perm in record.permissions" :key="perm.id" :title="perm.description">
                <Tag color="blue">{{ perm.name }}</Tag>
              </Tooltip>
            </div>
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDrawer('update', record)">编辑</Button>
              <Popconfirm
                title="确定要删除此角色吗？"
                @confirm="handleDeleteRole(record)"
              >
                <template #icon><QuestionCircleOutlined style="color: red" /></template>
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <RoleDrawer ref="roleDrawerRef" @success="handleSearch" />
  </div>
</template>
