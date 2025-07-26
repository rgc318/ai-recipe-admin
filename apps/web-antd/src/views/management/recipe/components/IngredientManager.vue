<script lang="ts" setup>
import {h, ref, watch} from 'vue';
import {
  Button,
  Select,
  Input,
  InputNumber,
  Space,
  Form,
  FormItem,
  message,
} from 'ant-design-vue';
import {
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
} from '@ant-design/icons-vue';
import draggable from 'vuedraggable'; // 你需要先安装它: npm install vuedraggable@next
import { debounce } from 'lodash-es'; // 你需要先安装它: npm install lodash-es @types/lodash-es

import type { RecipeIngredientInput, IngredientRead, UnitRead } from '../types';
import { searchIngredients } from '#/api/management/recipes/ingredient';
import {searchUnits} from "#/api/management/recipes/unit";

// --- 组件通信: v-model ---
const props = defineProps<{
  modelValue: RecipeIngredientInput[];
}>();

const emit = defineEmits(['update:modelValue']);

// --- 内部状态 ---
const internalIngredients = ref<RecipeIngredientInput[]>([]);
const ingredientOptions = ref<IngredientRead[]>([]);
const unitOptions = ref<UnitRead[]>([]);
const ingredientSearching = ref(false);
const unitSearching = ref(false);

// --- 核心逻辑 ---

// 当父组件传入数据时，同步到内部状态
watch(
  () => props.modelValue,
  (newValue) => {
    internalIngredients.value = JSON.parse(JSON.stringify(newValue || []));
  },
  { immediate: true, deep: true },
);

// 当内部状态变化时，通知父组件更新
function emitUpdate() {
  emit('update:modelValue', internalIngredients.value);
}

// 添加一行新配料
function addIngredient() {
  internalIngredients.value.push({
    ingredient_id: '',
    quantity: null,
    unit_id: null,
    note: '',
  });
  emitUpdate();
}

// 删除指定行的配料
function removeIngredient(index: number) {
  internalIngredients.value.splice(index, 1);
  emitUpdate();
}

// --- 远程搜索 (带防抖) ---

const handleIngredientSearch = debounce(async (query: string) => {
  if (!query) {
    ingredientOptions.value = [];
    return;
  }
  ingredientSearching.value = true;
  try {
    // 假设 searchIngredients API 返回匹配的食材列表
    const responseData = await searchIngredients({ name: query });
    ingredientOptions.value = responseData.items;
  } catch (error) {
    message.error('搜索食材失败');
  } finally {
    ingredientSearching.value = false;
  }
}, 300); // 300毫秒防抖

const handleUnitSearch = debounce(async (query: string) => {
  if (!query) {
    unitOptions.value = [];
    return;
  }
  unitSearching.value = true;
  try {
    const responseData = await searchUnits({ name: query }); // responseData 的类型是 PageResponse<UnitRead>
    unitOptions.value = responseData.items; // 我们只取其中的 items 数组
  } catch (error) {
    message.error('搜索单位失败');
  } finally {
    unitSearching.value = false;
  }
}, 300);
</script>

<template>
  <div class="ingredient-manager">
    <Form layout="vertical">
      <draggable
        v-model="internalIngredients"
        item-key="index"
        handle=".drag-handle"
        @end="emitUpdate"
      >
        <template #item="{ element: ingredient, index }">
          <Card class="mb-4" size="small">
            <div class="flex items-center gap-4">
              <HolderOutlined class="drag-handle cursor-move text-gray-400" />

              <Space direction="vertical" class="flex-grow">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormItem
                    :label="index === 0 ? '食材' : ''"
                    class="mb-0 flex-grow"
                    :name="['ingredients', index, 'ingredient_id']"
                    :rules="{ required: true, message: '请选择食材' }"
                  >
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
                    <InputNumber
                      v-model:value="ingredient.quantity"
                      placeholder="例如: 100"
                      class="w-full"
                      @change="emitUpdate"
                    />
                  </FormItem>

                  <FormItem :label="index === 0 ? '单位' : ''" class="mb-0">
                    <Select
                      v-model:value="ingredient.unit_id"
                      show-search
                      placeholder="搜索单位(克,个)"
                      :options="unitOptions"
                      :field-names="{ label: 'name', value: 'id' }"
                      :filter-option="false"
                      :loading="unitSearching"
                      allow-clear
                      @search="handleUnitSearch"
                      @change="emitUpdate"
                    />
                  </FormItem>

                  <FormItem :label="index === 0 ? '备注' : ''" class="mb-0">
                    <Input
                      v-model:value="ingredient.note"
                      placeholder="例如: 切丁、融化"
                      @change="emitUpdate"
                    />
                  </FormItem>
                </div>
              </Space>

              <Button
                type="text"
                danger
                shape="circle"
                :icon="h(DeleteOutlined)"
                @click="removeIngredient(index)"
              />
            </div>
          </Card>
        </template>
      </draggable>
    </Form>

    <Button type="dashed" block @click="addIngredient">
      <PlusOutlined />
      添加配料
    </Button>
  </div>
</template>

<style scoped>
.drag-handle {
  touch-action: none;
}
</style>
