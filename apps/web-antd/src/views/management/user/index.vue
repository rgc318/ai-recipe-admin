<script lang="ts" setup>
import { h, ref } from 'vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  Space,
  Tooltip,
} from 'ant-design-vue';
import { SyncOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';

import { useUserManagement } from './useUserManagement';
import UserDrawer from './userDrawer.vue';
import type { UserReadWithRoles } from './types';

const {
  loading,
  tableData,
  rolesForSelector,
  pagination,
  searchParams,
  handleTableChange,
  handleSearch,
  handleReset,
  handleDeleteUser,
  fetchData,
} = useUserManagement();

const userDrawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);

const openDrawer = (mode: 'create' | 'update', record?: UserReadWithRoles) => {
  userDrawerRef.value?.open(mode, record);
};

const formatDateTime = (date: string | null | undefined) =>
  date ? new Date(date).toLocaleString('zh-CN', { hour12: false }) : '-';

const createColumns = (): TableColumnType<UserReadWithRoles>[] => [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 120, fixed: 'left', sorter: true, align: 'center' },
  { title: '角色', dataIndex: 'roles', key: 'roles', width: 180, align: 'center' },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 100, sorter: true, align: 'center' },
  { title: '超级用户', dataIndex: 'is_superuser', key: 'is_superuser', width: 110, sorter: true, align: 'center' },
  { title: '已锁定', dataIndex: 'is_locked', key: 'is_locked', width: 100, sorter: true, align: 'center' },
  { title: '已验证', dataIndex: 'is_verified', key: 'is_verified', width: 100, sorter: true, align: 'center' },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 220, sorter: true, align: 'center' },
  { title: '全名', dataIndex: 'full_name', key: 'full_name', width: 120, sorter: true, align: 'center' },
  { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', width: 180, sorter: true, align: 'center' },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180, sorter: true, align: 'center' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, sorter: true, align: 'center' },
  { title: '操作', key: 'action', dataIndex: 'action', width: 130, fixed: 'right', align: 'center' },
];

const columns = createColumns();
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline" class="flex flex-wrap gap-x-4">
        <FormItem label="用户名">
          <Input v-model:value="searchParams.username" placeholder="模糊搜索用户名" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem label="邮箱">
          <Input v-model:value="searchParams.email" placeholder="模糊搜索邮箱" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem label="手机号">
          <Input v-model:value="searchParams.phone" placeholder="模糊搜索手机号" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem label="角色">
          <Select
            v-model:value="searchParams.role_ids"
            mode="multiple"
            :options="rolesForSelector"
            :field-names="{ label: 'name', value: 'id' }"
            placeholder="请选择角色"
            style="width: 200px"
            allow-clear
            max-tag-count="responsive"
          />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchParams.is_active" placeholder="请选择状态" style="width: 120px" allow-clear>
            <Select.Option :value="true">启用</Select.Option>
            <Select.Option :value="false">禁用</Select.Option>
          </Select>
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
        <Button type="primary" @click="openDrawer('create')">新增用户</Button>
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
        :scroll="{ x: 1800 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roles'">
            <div v-if="record.roles?.length" class="flex flex-wrap gap-1">
              <Tag v-for="role in record.roles" :key="role.id" color="blue">
                {{ role.name }}
              </Tag>
            </div>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'is_active'">
            <Tag :color="record.is_active ? 'success' : 'error'">
              {{ record.is_active ? '启用' : '禁用' }}
            </Tag>
          </template>

          <template v-if="column.key === 'is_superuser'">
            <Tag v-if="record.is_superuser" color="gold">是</Tag>
            <span v-else>否</span>
          </template>

          <template v-if="column.key === 'is_locked'">
            <Tag v-if="record.is_locked" color="warning">是</Tag>
            <span v-else>否</span>
          </template>

          <template v-if="column.key === 'is_verified'">
            <Tag v-if="record.is_verified" color="processing">是</Tag>
            <span v-else>否</span>
          </template>

          <template v-if="['last_login_at', 'updated_at', 'created_at'].includes(column.key as string)">
            <span>{{ formatDateTime(record[column.dataIndex as keyof UserReadWithRoles]) }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openDrawer('update', record)">编辑</Button>
              <Popconfirm
                title="确定要删除此用户吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDeleteUser(record)"
              >
                <template #icon><QuestionCircleOutlined style="color: red" /></template>
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <UserDrawer ref="userDrawerRef" @success="handleSearch" />
  </div>
</template>
