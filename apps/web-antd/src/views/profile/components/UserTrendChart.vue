<script lang="ts" setup>
// 1. 引入你项目中真实存在的、正确的类型、组件和 Hook
import type { EchartsUIType } from '@vben/plugins/echarts';

import { ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

// 你的 props 定义保持不变
const props = defineProps<{ mode?: 'daily' | 'weekly' }>();

// 2. 创建对 <EchartsUI> 组件的引用
const chartRef = ref<EchartsUIType>();

// 3. 使用正确的 useEcharts hook，并获取 renderEcharts 方法
const { renderEcharts } = useEcharts(chartRef);

// 4. 你的数据加载和图表渲染逻辑
const loadAndRenderChart = (mode = 'daily') => {
  const chartData =
    mode === 'weekly'
      ? [
          { date: '周一', value: 120 },
          { date: '周二', value: 180 },
          { date: '周三', value: 160 },
          { date: '周四', value: 200 },
          { date: '周五', value: 300 },
          { date: '周六', value: 240 },
          { date: '周日', value: 310 },
        ]
      : [
          { date: '07-01', value: 120 },
          { date: '07-02', value: 180 },
          { date: '07-03', value: 140 },
          { date: '07-04', value: 220 },
          { date: '07-05', value: 260 },
          { date: '07-06', value: 300 },
          { date: '07-07', value: 380 },
        ];

  // 5. 使用 renderEcharts 方法，并传入 ECharts 的配置对象 (option)
  renderEcharts({
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: chartData.map((item) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: chartData.map((item) => item.value),
        type: 'line',
        smooth: true,
      },
    ],
  });
};

// 监听 props 变化来重新渲染图表，这个逻辑依然正确
watch(
  () => props.mode,
  (val) => loadAndRenderChart(val),
  { immediate: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" style="width: 100%; height: 300px" />
</template>
