<script setup lang="ts">
// 1. 引入正确的 ECharts 相关工具
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

// 2. 你的原始数据，保持不变
const chartData = ref([
  { type: '启用', value: 760 },
  { type: '禁用', value: 220 },
  { type: '冻结', value: 80 },
]);

// 3. 创建对 <EchartsUI> 组件的引用
const chartRef = ref<EchartsUIType>();

// 4. 初始化 useEcharts hook
const { renderEcharts } = useEcharts(chartRef);

// 5. 在组件挂载后，渲染图表
onMounted(() => {
  renderEcharts({
    // 提示框
    tooltip: {
      trigger: 'item',
    },
    // 图例
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    // 系列（核心配置）
    series: [
      {
        name: '用户状态',
        type: 'pie', // 图表类型为饼图
        radius: '80%', // 饼图半径
        // 将你的数据转换为 ECharts 需要的格式
        data: chartData.value.map((item) => ({
          value: item.value,
          name: item.type,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" style="width: 100%; height: 300px" />
</template>
