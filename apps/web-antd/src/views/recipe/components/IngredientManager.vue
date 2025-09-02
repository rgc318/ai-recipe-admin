<script lang="ts" setup>
import {computed, h, ref, watch} from 'vue';
import { Button, AutoComplete, Select, Input, InputNumber, Form, FormItem, message, Card } from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, HolderOutlined } from "@ant-design/icons-vue";
import draggable from 'vuedraggable';
import { debounce } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

import { useRecipeReferenceStore } from '#/store/modules/recipeReference';
import type { RecipeIngredientInput, IngredientRead } from '../types';
import { searchIngredients } from '#/api/recipes/ingredient';

// --- 【全新】定义UI所需的、更直观的嵌套数据结构 ---
interface UIIngredient extends RecipeIngredientInput {
  ui_id: string; // 用于v-for的唯一key
}
interface UIGroup {
  ui_id: string; // 用于v-for的唯一key
  name: string;
  ingredients: UIIngredient[];
}

// --- 组件通信 (v-model) ---
const props = defineProps<{ modelValue: RecipeIngredientInput[] }>();
const emit = defineEmits(['update:modelValue']);

// --- 内部状态 ---
const internalGroups = ref<UIGroup[]>([]); // UI使用的、嵌套的列表
const ingredientOptions = ref<IngredientRead[]>([]);
const ingredientSearching = ref(false);

const referenceStore = useRecipeReferenceStore();
const { allUnits } = storeToRefs(referenceStore);

// --- 核心逻辑 ---

const optimizedUnitOptions = computed(() => {
  if (!allUnits.value || allUnits.value.length === 0) {
    return [];
  }

  // 1. 定义常用单位的“权重”。名字越靠前，排序越靠前。
  const commonUnitsOrder = ['克', 'g', '毫升', 'ml', '个', '勺', '茶匙', '汤匙', '片', '块'];

  // 2. 对从 store 拿到的原始列表进行排序
  const sortedUnits = [...allUnits.value].sort((a, b) => {
    const indexA = commonUnitsOrder.indexOf(a.name);
    const indexB = commonUnitsOrder.indexOf(b.name);

    // 如果两个单位都在常用列表里，按列表里的顺序排
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // 如果只有 A 在常用列表里，A 排前面
    if (indexA !== -1) return -1;
    // 如果只有 B 在常用列表里，B 排前面
    if (indexB !== -1) return 1;
    // 如果都不在，按原始顺序（或按字母顺序）
    return a.name.localeCompare(b.name);
  });

  return sortedUnits;
});

// 1. 【核心修改】将 internalGroupsToFlatData 函数的定义，提前到所有 watch 函数之前
const internalGroupsToFlatData = (): RecipeIngredientInput[] => {
  const flatIngredients: RecipeIngredientInput[] = [];
  internalGroups.value.forEach(group => {
    const groupName = group.name.trim() || null;
    group.ingredients.forEach(ing => {
      let finalIngredientValue: any = null;
      if(ing.ingredientId) {
        // 如果有ID，就回传包含ID和Name的对象，方便下次加载
        finalIngredientValue = { value: ing.ingredientId, label: ing.ingredientName };
      } else {
        // 如果没有ID，就回传字符串
        finalIngredientValue = ing.ingredientName;
      }

      flatIngredients.push({
        ingredient: finalIngredientValue,
        unit_id: ing.unit_id,
        group: groupName,
        quantity: ing.quantity,
        note: ing.note,
      });
    });
  });
  return flatIngredients;
};

const isUuid = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// watch 1: 当父组件传入扁平数据时，转换为UI的嵌套分组列表
watch(() => props.modelValue, (newValue) => {
  // 这段逻辑非常复杂，为了保证正确性，我们使用一个简化但有效的深比较
  const newFlatValue = JSON.stringify(newValue);
  const oldFlatValue = JSON.stringify(internalGroupsToFlatData());
  if (newFlatValue === oldFlatValue) {
    return;
  }

  const groupsMap = new Map<string, UIIngredient[]>();
  const UNGROUPED_KEY = '__UNGROUPED__';
  groupsMap.set(UNGROUPED_KEY, []);

  (newValue || []).forEach(ing => {
    const groupName = ing.group || UNGROUPED_KEY;
    if (!groupsMap.has(groupName)) {
      groupsMap.set(groupName, []);
    }
    const ingredientValue = ing.ingredient;

    // 【核心修正】正确解析父组件传来的数据
    let id: string | null = null;
    let name: string | null = null;

    if (typeof ingredientValue === 'object' && ingredientValue?.value) {
      // 如果是 { value, label } 对象 (已存在的食材)
      id = ingredientValue.value;
      name = ingredientValue.label;
    } else if (typeof ingredientValue === 'string') {
      // 如果是字符串 (新创建的食材)
      name = ingredientValue;
    }

    groupsMap.get(groupName)!.push({
      ui_id: uuidv4(),
      ingredientId: id,
      ingredientName: name,
      unit_id: ing.unit_id,
      group: ing.group,
      quantity: ing.quantity,
      note: ing.note,
    });
  });

  const newUiGroups: UIGroup[] = [];
  groupsMap.forEach((ingredients, groupName) => {
    if (groupName !== UNGROUPED_KEY) {
      newUiGroups.push({ ui_id: uuidv4(), name: groupName, ingredients });
    }
  });
  const ungroupedIngredients = groupsMap.get(UNGROUPED_KEY)!;
  if (ungroupedIngredients.length > 0 || (newUiGroups.length === 0 && newValue?.length > 0)) {
    newUiGroups.push({ ui_id: uuidv4(), name: '', ingredients: ungroupedIngredients });
  }

  internalGroups.value = newUiGroups;
}, { immediate: true, deep: true });

// watch 2: 当UI的嵌套列表变化时，转换为扁平列表并通知父组件
watch(internalGroups, (newGroups) => {
  const flatIngredients: RecipeIngredientInput[] = [];
  newGroups.forEach(group => {
    const groupName = group.name.trim() || null;
    group.ingredients.forEach(ing => {
      // 复用你在 internalGroupsToFlatData 函数中已经写好的正确逻辑
      let finalIngredient: any;
      if (ing.ingredientId && ing.ingredientName) {
        // 如果是用户选择的已有食材，回传包含ID和Name的对象
        finalIngredient = { value: ing.ingredientId, label: ing.ingredientName };
      } else {
        // 如果是用户输入的新食材，回传字符串
        finalIngredient = ing.ingredientName;
      }

      flatIngredients.push({
        ingredient: finalIngredient, // 使用修正后的值
        unit_id: ing.unit_id,
        group: groupName,
        quantity: ing.quantity,
        note: ing.note,
      });
    });
  });

  // 只有数据变化时才通知父组件，避免无限循环
  if (JSON.stringify(props.modelValue) !== JSON.stringify(flatIngredients)) {
    emit('update:modelValue', flatIngredients);
  }
}, { deep: true });


// --- 事件处理 ---
function addGroup() {
  const baseName = '新的分组';
  // 1. 获取所有已存在的分组名，放入一个 Set 中以便快速查找
  const existingNames = new Set(internalGroups.value.map(group => group.name));

  let newGroupName = baseName;
  let counter = 2;

  // 2. 循环检查，直到找到一个不重复的名称
  // 例如，如果 "新的分组" 已存在，就尝试 "新的分组 2"，以此类推
  while (existingNames.has(newGroupName)) {
    newGroupName = `${baseName} ${counter}`;
    counter++;
  }

  // 3. 使用这个独一无二的名称来创建新分组
  internalGroups.value.push({
    ui_id: uuidv4(),
    name: newGroupName,
    ingredients: [],
  });
}

function addIngredient(group: UIGroup) {
  group.ingredients.push({
    ui_id: uuidv4(), ingredientId: null, ingredientName: '',
    quantity: null, unit_id: null, note: null, group: group.name,
  });
}

function removeGroup(groupIndex: number) {
  internalGroups.value.splice(groupIndex, 1);
}

function removeIngredient(group: UIGroup, ingredientIndex: number) {
  group.ingredients.splice(ingredientIndex, 1);
}

// ... 搜索和过滤逻辑保持不变 ...
const handleIngredientSearch = debounce(async (query: string) => {
  if (!query) { ingredientOptions.value = []; return; }
  ingredientSearching.value = true;
  try {
    const responseData = await searchIngredients({ name: query });
    // 【核心修改】在这里进行格式转换
    ingredientOptions.value = responseData.items.map(item => ({
      value: item.id,   // 将 id 映射到 value
      label: item.name, // 将 name 映射到 label
    }));
  } catch (error) { message.error('搜索食材失败');
  } finally { ingredientSearching.value = false; }
}, 300);

function handleIngredientSelect(ingredient: UIIngredient, value: string, option: { value: string, label: string }) {
  ingredient.ingredientId = value;
  ingredient.ingredientName = option.label;
}
const filterUnitOption = (input: string, option: any) => option.name.toLowerCase().includes(input.toLowerCase());

function getGroupNameStatus(name: string, currentId: string): '' | 'error' {
  // 查找是否存在其他分组也叫这个名字
  const isDuplicate = internalGroups.value.some(
    group => group.name === name && group.ui_id !== currentId
  );
  return isDuplicate ? 'error' : '';
}

// 如果名称重复，提供提示信息
function getGroupNameHelp(name: string, currentId: string): string {
  if (getGroupNameStatus(name, currentId) === 'error') {
    return '分组名称已存在，会导致配料自动合并';
  }
  return '';
}
</script>

<template>
  <div class="ingredient-manager">
    <draggable v-model="internalGroups" :item-key="'ui_id'" handle=".group-drag-handle" class="space-y-4">
      <template #item="{ element: group, index: groupIndex }">
        <Card class="bg-gray-50 dark:bg-gray-800/50">
          <div class="flex items-center gap-2 mb-4 border-b pb-2">
            <HolderOutlined class="group-drag-handle cursor-move text-gray-400 text-lg" />
            <FormItem
              class="flex-grow mb-0"
              :validate-status="getGroupNameStatus(group.name, group.ui_id)"
              :help="getGroupNameHelp(group.name, group.ui_id)"
            >
            <Input v-model:value="group.name" placeholder="输入分组名 (例如: 面团部分)，留空则为未分组" class="font-bold text-base border-none bg-transparent shadow-none" />
            </FormItem>
            <Button type="text" danger shape="circle" :icon="h(DeleteOutlined)" @click="removeGroup(groupIndex)" />
          </div>

          <draggable v-model="group.ingredients" :item-key="'ui_id'" handle=".ingredient-drag-handle" group="ingredients" class="min-h-[50px]">
            <template #item="{ element: ingredient, index: ingredientIndex }">
              <div class="flex items-center gap-4 mb-3">
                <HolderOutlined class="ingredient-drag-handle cursor-move text-gray-400" />
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow">
                  <FormItem class="mb-0">
                    <AutoComplete
                      v-model:value="ingredient.ingredientName"
                      :options="ingredientOptions"
                      style="width: 100%"
                      placeholder="搜索或输入新食材"
                      @search="handleIngredientSearch"
                      @select="(value, option) => handleIngredientSelect(ingredient, value, option)"
                    />
                  </FormItem>
                  <FormItem class="mb-0">
                    <InputNumber v-model:value="ingredient.quantity" placeholder="数量" class="w-full" />
                  </FormItem>
                  <FormItem class="mb-0">
                    <Select
                      v-model:value="ingredient.unit_id"
                      show-search
                      placeholder="单位"

                      :options="optimizedUnitOptions"

                      :field-names="{ label: 'name', value: 'id' }"
                      :filter-option="filterUnitOption" allow-clear
                    />
                  </FormItem>
                  <FormItem class="mb-0">
                    <Input v-model:value="ingredient.note" placeholder="备注 (例如: 切丁)" />
                  </FormItem>
                </div>
                <Button type="text" danger shape="circle" :icon="h(DeleteOutlined)" @click="removeIngredient(group, ingredientIndex)" />
              </div>
            </template>
          </draggable>

          <Button type="dashed" size="small" @click="addIngredient(group)" class="mt-2 ml-8">
            <PlusOutlined /> 在此分组添加配料
          </Button>
        </Card>
      </template>
    </draggable>

    <Button type="dashed" block @click="addGroup" class="mt-4">
      <PlusOutlined /> 添加新分组
    </Button>
  </div>
</template>
