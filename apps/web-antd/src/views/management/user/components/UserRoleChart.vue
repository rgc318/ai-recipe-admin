<script setup lang="ts">
// 1. 引入正确的 ECharts 相关工具
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

// 2. 你的原始数据，保持不变
const chartData = ref([
  { type: '管理员', value: 120 },
  { type: '运营人员', value: 180 },
  { type: '普通用户', value: 600 },
  { type: '游客', value: 80 },
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
      bottom: '5%',
      left: 'center',
    },
    // 系列（核心配置）
    series: [
      {
        name: '用户角色',
        type: 'pie', // 图表类型为饼图
        radius: ['40%', '70%'], // 设置为环形图（甜甜圈图）
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        // 将你的数据转换为 ECharts 需要的格式
        data: chartData.value.map((item) => ({
          value: item.value,
          name: item.type,
        })),
      },
    ],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" style="width: 100%; height: 300px" />
</template>
