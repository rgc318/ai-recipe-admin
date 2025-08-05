<script lang="ts" setup>
import { h, ref, watch } from 'vue';
import {
  Button,
  Select,
  Input,
  InputNumber,
  Space,
  Form,
  FormItem,
  message,
  Card,
} from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons-vue';
import draggable from 'vuedraggable';
import { debounce } from 'lodash-es';
import { storeToRefs } from 'pinia';

import { useRecipeReferenceStore } from '#/store/modules/recipeReference';
import type { RecipeIngredientInput, IngredientRead } from '../types';
import { searchIngredients } from '#/api/recipes/ingredient';

// --- 组件通信: v-model ---
const props = defineProps<{
  modelValue: RecipeIngredientInput[];
}>();
const emit = defineEmits(['update:modelValue']);

// --- 内部状态 ---
const internalIngredients = ref<RecipeIngredientInput[]>([]);
const ingredientOptions = ref<IngredientRead[]>([]);
const ingredientSearching = ref(false);

// --- 【核心修改】从 Pinia Store 获取所有单位 ---
const referenceStore = useRecipeReferenceStore();
const { allUnits } = storeToRefs(referenceStore); // allUnits 是一个 UnitRead[]

// --- 核心逻辑 ---
watch(
  () => props.modelValue,
  (newValue) => {
    internalIngredients.value = JSON.parse(JSON.stringify(newValue || []));
  },
  { immediate: true, deep: true },
);

function emitUpdate() {
  emit('update:modelValue', internalIngredients.value);
}

function addIngredient() {
  internalIngredients.value.push({
    ingredient_id: '',
    quantity: null,
    unit_id: null,
    note: '',
  });
  emitUpdate();
}

function removeIngredient(index: number) {
  internalIngredients.value.splice(index, 1);
  emitUpdate();
}

// 食材远程搜索 (保持不变)
const handleIngredientSearch = debounce(async (query: string) => {
  if (!query) {
    ingredientOptions.value = [];
    return;
  }
  ingredientSearching.value = true;
  try {
    const responseData = await searchIngredients({ name: query });
    ingredientOptions.value = responseData.items;
  } catch (error) {
    message.error('搜索食材失败');
  } finally {
    ingredientSearching.value = false;
  }
}, 300);

// 【核心修改】本地搜索单位的过滤函数
const filterUnitOption = (input: string, option: any) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};
</script>

<template>
  <div class="ingredient-manager">
    <Form layout="vertical">
      <draggable v-model="internalIngredients" item-key="index" handle=".drag-handle" @end="emitUpdate">
        <template #item="{ element: ingredient, index }">
          <Card class="mb-4" size="small">
            <div class="flex items-center gap-4">
              <HolderOutlined class="drag-handle cursor-move text-gray-400" />
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow">
                <FormItem :label="index === 0 ? '食材' : ''" class="mb-0" :rules="{ required: true, message: '请选择食材' }">
                  <Select
                    v-model:value="ingredient.ingredient_id"
                    show-search
                    placeholder="搜索并选择食材"
                    :options="ingredientOptions"
                    :field-names="{ label: 'name', value: 'id' }"
                    :filter-option="false"
                    :loading="ingredientSearching"
                    @search="handleIngredientSearch"
                    @change="emitUpdate"
                  />
                </FormItem>
                <FormItem :label="index === 0 ? '数量' : ''" class="mb-0">
                  <InputNumber v-model:value="ingredient.quantity" placeholder="例如: 100" class="w-full" @change="emitUpdate" />
                </FormItem>
                <FormItem :label="index === 0 ? '单位' : ''" class="mb-0">
                  <!-- 【核心修改】单位选择器改为本地搜索 -->
                  <Select
                    v-model:value="ingredient.unit_id"
                    show-search
                    placeholder="选择或搜索单位"
                    :options="allUnits"
                    :field-names="{ label: 'name', value: 'id' }"
                    :filter-option="filterUnitOption"
                    allow-clear
                    @change="emitUpdate"
                  />
                </FormItem>
                <FormItem :label="index === 0 ? '备注' : ''" class="mb-0">
                  <Input v-model:value="ingredient.note" placeholder="例如: 切丁、融化" @change="emitUpdate" />
                </FormItem>
              </div>
              <Button type="text" danger shape="circle" :icon="h(DeleteOutlined)" @click="removeIngredient(index)" />
            </div>
          </Card>
        </template>
      </draggable>
    </Form>
    <Button type="dashed" block @click="addIngredient">
      <PlusOutlined /> 添加配料
    </Button>
  </div>
</template>
