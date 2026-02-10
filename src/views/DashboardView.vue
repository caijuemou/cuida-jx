<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 bg-slate-900/40 rounded-[2.5rem] p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col min-h-[450px]">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-black flex items-center">
          <div class="w-2 h-6 bg-indigo-500 rounded-full mr-3 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          门店扣分排行 (Top 15 Stores)
        </h3>
        <span class="text-[10px] text-slate-500 font-bold px-3 py-1 bg-slate-800 rounded-full">BY DEPT NAME</span>
      </div>
      <div class="flex-1 w-full" ref="chartRef"></div>
    </div>

    <div class="bg-slate-900/40 rounded-[2.5rem] p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col h-[450px] md:h-[530px]">
      <div class="flex flex-col mb-6">
        <h3 class="text-lg font-black flex items-center">
          <div class="w-2 h-6 bg-amber-500 rounded-full mr-3 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
          考核大类分布
        </h3>
        <p class="text-[10px] text-slate-500 font-bold mt-1 ml-5 uppercase">Category Weight Analysis</p>
      </div>
      
      <div class="flex-1 w-full" ref="pieChartRef"></div>

      <div class="mt-4 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
        <div class="flex items-center gap-2 mb-1">
          <ZapIcon :size="14" class="text-amber-500" />
          <span class="text-[10px] text-amber-500 font-black uppercase tracking-widest">Management Focus</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
          当前数据指示 <span class="text-amber-200 font-bold">{{ topCategory }}</span> 为主要扣分项，需加强该模块的专项培训。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, markRaw, computed } from 'vue'
import { supabase } from '../composables/useSupabase'
import * as echarts from 'echarts'
import { ActivityIcon, UsersIcon, BarChart3Icon, ZapIcon } from 'lucide-vue-next'

const chartRef = ref(null)
const pieChartRef = ref(null)
let myChart = null
let myPieChart = null
const topCategory = ref('加载中...')

// 1. 数据抓取与分类聚合
const fetchDashboardData = async () => {
  try {
    const { data: allLogs, error } = await supabase
      .from('perf_records')
      .select('score_value, target_dept_name, category_label, record_date, target_user_id')

    if (error) throw error

    if (allLogs) {
      // A. 更新统计卡片 (逻辑同上)
      const totalScore = allLogs.reduce((s, c) => s + Math.abs(parseFloat(c.score_value) || 0), 0)
      stats.value[0].value = totalScore.toLocaleString()
      // ... 其它统计略 ...

      // B. 聚合逻辑
      const storeMap = {}
      const categoryMap = {}

      allLogs.forEach(log => {
        const val = Math.abs(parseFloat(log.score_value) || 0)
        
        // 门店统计
        const store = log.target_dept_name || '未归属'
        storeMap[store] = (storeMap[store] || 0) + val

        // 大类统计
        const cat = log.category_label || '其他'
        categoryMap[cat] = (categoryMap[cat] || 0) + val
      })

      // C. 更新柱状图
      const barData = Object.entries(storeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 15)
      renderBarChart(barData)

      // D. 更新饼图
      const pieData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
      
      if(pieData.length > 0) topCategory.value = pieData[0].name
      renderPieChart(pieData)
    }
  } catch (err) {
    console.error('Data Error:', err)
  }
}

// 2. 渲染饼图 (关键修改)
const renderPieChart = (data) => {
  if (!pieChartRef.value) return
  if (!myPieChart) myPieChart = echarts.init(pieChartRef.value)

  // 预设配色，根据 Category 关键字自动匹配
  const colorPalette = {
    '环境': '#fbbf24', // 琥珀色
    '服务': '#f43f5e', // 玫瑰红
    '品质': '#8b5cf6', // 紫色
    '考勤': '#06b6d4', // 青色
    '安全': '#ef4444'  // 红色
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: '#334155',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: '{b}: <b style="color:#f43f5e">-{c}分</b> ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '5%',
      left: 'center',
      textStyle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
      itemWidth: 10,
      itemHeight: 10,
      pageIconColor: '#6366f1'
    },
    series: [{
      name: '考核维度',
      type: 'pie',
      radius: ['45%', '70%'], // 环形设计
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 12,
        borderColor: '#020617',
        borderWidth: 4
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: '900',
          color: '#fff',
          formatter: '{b}'
        },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      data: data.map(item => {
        // 动态分配颜色
        let itemColor = '#6366f1' // 默认靛蓝色
        for (let key in colorPalette) {
          if (item.name.includes(key)) itemColor = colorPalette[key]
        }
        return { ...item, itemStyle: { color: itemColor } }
      })
    }]
  }
  myPieChart.setOption(option)
}

// 3. 渲染柱状图 (略，保持之前的逻辑)
const renderBarChart = (data) => { /* ... */ }

// ... 生命周期钩子 ...
</script>
