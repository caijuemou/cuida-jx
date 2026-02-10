<template>
  <div class="min-h-screen bg-[#020617] text-white p-4 md:p-6 font-sans">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tighter">
          CUIDA 绩效实时监控大屏
        </h1>
        <p class="text-slate-400 text-[10px] md:text-xs mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Live Performance Analytics
        </p>
      </div>
      <div class="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-indigo-500/50 pl-4 md:pr-4">
        <div class="text-2xl font-mono font-bold text-indigo-400 leading-none">{{ currentTime }}</div>
        <div class="text-[10px] text-slate-500 font-bold uppercase mt-1">System Refreshing</div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-slate-900/40 p-5 md:p-6 rounded-3xl border border-slate-800 relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
          <component :is="stat.icon" :size="60" />
        </div>
        <p class="text-slate-500 text-[10px] md:text-xs font-bold mb-2 uppercase tracking-wider relative z-10">{{ stat.label }}</p>
        <div class="flex items-end gap-1 md:gap-2 relative z-10">
          <span class="text-2xl md:text-4xl font-black tracking-tighter text-white tabular-nums">{{ stat.value }}</span>
          <span class="text-indigo-500 text-[10px] font-bold mb-1">{{ stat.unit }}</span>
        </div>
      </div>
    </div>

    <div v-if="hasData" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-slate-900/40 rounded-[2rem] p-6 md:p-8 border border-slate-800 flex flex-col min-h-[450px]">
        <h3 class="text-lg font-black flex items-center mb-6">
          <div class="w-2 h-6 bg-blue-500 rounded-full mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          门店扣分汇总 (Top 15)
        </h3>
        <div class="flex-1 w-full" ref="barChartRef"></div>
      </div>

      <div class="bg-slate-900/40 rounded-[2rem] p-6 md:p-8 border border-slate-800 flex flex-col h-[450px] md:h-[530px]">
        <h3 class="text-lg font-black flex items-center mb-6">
          <div class="w-2 h-6 bg-amber-500 rounded-full mr-3 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
          考核大类分布
        </h3>
        <div class="flex-1 w-full" ref="pieChartRef"></div>
        <div class="mt-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-xs text-slate-400 italic">
          提示：重点改进占比最高的环节以提升整体服务质量。
        </div>
      </div>
    </div>

    <div v-else class="h-96 flex flex-col items-center justify-center bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-800 text-slate-500">
      <ActivityIcon :size="48" class="mb-4 opacity-20" />
      <p class="text-lg font-bold tracking-widest uppercase">暂无考核数据</p>
      <p class="text-xs mt-2">请确认 perf_records 表中是否有记录</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, markRaw } from 'vue'
import { supabase } from '../composables/useSupabase'
import * as echarts from 'echarts'
import { ActivityIcon, UsersIcon, BarChart3Icon, ZapIcon } from 'lucide-vue-next'

const currentTime = ref('')
const barChartRef = ref(null)
const pieChartRef = ref(null)
const hasData = ref(false)

let barChart = null
let pieChart = null

const stats = ref([
  { label: '累计扣分分值', value: '0', unit: 'Pts', icon: markRaw(BarChart3Icon) },
  { label: '覆盖员工总数', value: '0', unit: 'Pax', icon: markRaw(UsersIcon) },
  { label: '今日新增记录', value: '0', unit: 'Rec', icon: markRaw(ZapIcon) },
  { label: '系统状态', value: 'Active', unit: 'OK', icon: markRaw(ActivityIcon) }
])

// 格式化时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

// 主数据抓取函数
const fetchDashboardData = async () => {
  try {
    console.log('正在从 Supabase 获取数据...')
    const { data, error } = await supabase
      .from('perf_records')
      .select('score_value, target_dept_name, category_label, record_date, target_user_id')

    if (error) {
      console.error('Supabase 读取失败:', error.message)
      return
    }

    console.log('获取到的原始记录数:', data?.length || 0)

    if (!data || data.length === 0) {
      hasData.value = false
      return
    }

    hasData.value = true
    
    // 1. 基础统计计算
    let totalScore = 0
    const userSet = new Set()
    const todayStr = new Date().toISOString().split('T')[0]
    let todayCount = 0

    // 2. 聚合图表数据
    const storeMap = {}
    const categoryMap = {}

    data.forEach(log => {
      // 处理文本类型的分值，只提取数字部分
      const rawScore = log.score_value ? String(log.score_value).replace(/[^0-9.-]/g, '') : '0'
      const val = Math.abs(parseFloat(rawScore) || 0)

      totalScore += val
      if (log.target_user_id) userSet.add(log.target_user_id)
      if (log.record_date === todayStr) todayCount++

      // 聚合门店
      const sName = log.target_dept_name || '未定义门店'
      storeMap[sName] = (storeMap[sName] || 0) + val

      // 聚合大类
      const cName = log.category_label || '其他'
      categoryMap[cName] = (categoryMap[cName] || 0) + val
    })

    // 更新卡片数值
    stats.value[0].value = totalScore.toLocaleString()
    stats.value[1].value = userSet.size.toLocaleString()
    stats.value[2].value = todayCount.toLocaleString()

    // 3. 渲染图表
    const barData = Object.entries(storeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 15)
    
    const pieData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))

    // 必须要等待 DOM 更新后再渲染 Echarts
    setTimeout(() => {
      initBarChart(barData)
      initPieChart(pieData)
    }, 100)

  } catch (err) {
    console.error('代码运行错误:', err)
  }
}

const initBarChart = (data) => {
  if (!barChartRef.value) return
  if (!barChart) barChart = echarts.init(barChartRef.value)
  
  barChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '3%', bottom: '15%', top: '10%', containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      data: data.map(d => d.value),
      type: 'bar',
      barWidth: '40%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#6366f1' },
          { offset: 1, color: '#4338ca' }
        ]),
        borderRadius: [6, 6, 0, 0]
      }
    }]
  })
}

const initPieChart = (data) => {
  if (!pieChartRef.value) return
  if (!pieChart) pieChart = echarts.init(pieChartRef.value)

  pieChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} Pts ({d}%)' },
    legend: {
      bottom: '0',
      textStyle: { color: '#94a3b8', fontSize: 10 },
      itemWidth: 10
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#020617', borderWidth: 2 },
      label: { show: false },
      data: data.map(item => {
        // 简单颜色分配
        const colors = ['#f43f5e', '#fbbf24', '#8b5cf6', '#06b6d4', '#6366f1']
        const idx = Math.floor(Math.random() * colors.length)
        return { ...item, itemStyle: { color: colors[idx] } }
      })
    }]
  })
}

let refreshTimer, timeTimer

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
  fetchDashboardData()
  refreshTimer = setInterval(fetchDashboardData, 60000) // 每分钟刷新

  window.addEventListener('resize', () => {
    barChart?.resize()
    pieChart?.resize()
  })
})

onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(refreshTimer)
})
</script>

<style scoped>
/* 针对图表高度的移动端优化 */
@media (max-width: 768px) {
  .min-h-\[450px\] {
    min-h-[350px];
  }
}
</style>
