<script lang="ts" setup>
import { onMounted, h } from 'vue';
import { Button, Card, Form, FormItem, Input, Table, Space, Tooltip } from 'ant-design-vue';
import { SyncOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';

import { useUnitManagement } from './useUnitsManagement';
import type { UnitRead } from './types';
import UnitModal from './UnitModal.vue';

const {
  loading, tableData, searchParams, pagination,
  modalVisible, modalLoading, modalTitle, currentUnit,
  handleTableChange, handleSearch, handleReset, fetchData,
  handleAddNew, handleEdit, handleDelete, handleModalOk,
} = useUnitManagement();

const columns: TableColumnType<UnitRead>[] = [
  { title: '单位名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '缩写', dataIndex: 'abbreviation', key: 'abbreviation', sorter: true },
  { title: '复数名称', dataIndex: 'plural_name', key: 'plural_name', sorter: true },
  {
    title: '操作', key: 'action', width: 120,
    customRender: ({ record }) => h(Space, {}, () => [
      h(Button, { type: 'link', shape: 'circle', icon: h(EditOutlined), onClick: () => handleEdit(record) }),
      h(Button, { type: 'link', shape: 'circle', danger: true, icon: h(DeleteOutlined), onClick: () => handleDelete(record.id) }),
    ]),
  },
];

onMounted(() => { fetchData(); });
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline">
        <FormItem label="单位名称">
          <Input v-model:value="searchParams.name" placeholder="按名称或缩写模糊搜索" allow-clear @pressEnter="handleSearch" />
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
        <Button type="primary" :icon="h(PlusOutlined)" @click="handleAddNew">新增单位</Button>
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
      />
    </Card>

    <UnitModal
      v-model:visible="modalVisible"
      :loading="modalLoading"
      :title="modalTitle"
      :unit-data="currentUnit"
      @ok="handleModalOk"
    />
  </div>
</template>
